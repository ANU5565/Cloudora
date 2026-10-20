from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.folder import Folder
from app.models.file import File
from app.models.user import User
from app.models.audit import AuditEvent
from app.schemas.folder import FolderCreateRequest, FolderPatchRequest, BreadcrumbItem
from app.core.exceptions import ResourceNotFoundException, PermissionDeniedException, FolderCycleException


class FolderService:
    @staticmethod
    def create_folder(db: Session, user: User, data: FolderCreateRequest) -> Folder:
        parent_id = data.parent_id
        if parent_id:
            parent = db.query(Folder).filter(Folder.id == parent_id, Folder.is_trashed == False).first()
            if not parent:
                raise ResourceNotFoundException("Parent folder")
            if parent.owner_id != user.id:
                raise PermissionDeniedException("Cannot create folder in another user's directory")

        folder = Folder(
            owner_id=user.id,
            parent_id=parent_id,
            name=data.name.strip()
        )
        db.add(folder)
        db.commit()
        db.refresh(folder)

        audit = AuditEvent(
            user_id=user.id,
            action="FOLDER_CREATED",
            target_type="folder",
            target_id=folder.id,
            details=f"Created folder '{folder.name}'"
        )
        db.add(audit)
        db.commit()

        return folder

    @staticmethod
    def get_breadcrumbs(db: Session, folder_id: Optional[str], user_id: str) -> List[BreadcrumbItem]:
        breadcrumbs = [BreadcrumbItem(id=None, name="All Files")]
        if not folder_id:
            return breadcrumbs

        curr_id = folder_id
        chain = []
        visited = set()

        while curr_id and curr_id not in visited:
            visited.add(curr_id)
            f = db.query(Folder).filter(Folder.id == curr_id, Folder.owner_id == user_id).first()
            if not f:
                break
            chain.append(BreadcrumbItem(id=f.id, name=f.name))
            curr_id = f.parent_id

        chain.reverse()
        breadcrumbs.extend(chain)
        return breadcrumbs

    @staticmethod
    def check_folder_cycle(db: Session, folder_id: str, new_parent_id: Optional[str]):
        """Ensure new_parent_id is not folder_id itself or any of its descendants."""
        if not new_parent_id:
            return
        if folder_id == new_parent_id:
            raise FolderCycleException()

        curr_parent = new_parent_id
        visited = set()
        while curr_parent and curr_parent not in visited:
            visited.add(curr_parent)
            if curr_parent == folder_id:
                raise FolderCycleException()
            parent = db.query(Folder).filter(Folder.id == curr_parent).first()
            if not parent:
                break
            curr_parent = parent.parent_id

    @staticmethod
    def patch_folder(db: Session, user: User, folder_id: str, data: FolderPatchRequest) -> Folder:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.is_trashed == False).first()
        if not folder:
            raise ResourceNotFoundException("Folder")
        if folder.owner_id != user.id:
            raise PermissionDeniedException("Cannot edit folder owned by another user")

        if data.name:
            folder.name = data.name.strip()

        if data.parent_id is not None:
            # If moving to root
            if data.parent_id == "" or data.parent_id == "root":
                folder.parent_id = None
            else:
                FolderService.check_folder_cycle(db, folder.id, data.parent_id)
                new_parent = db.query(Folder).filter(Folder.id == data.parent_id, Folder.is_trashed == False).first()
                if not new_parent:
                    raise ResourceNotFoundException("Target parent folder")
                if new_parent.owner_id != user.id:
                    raise PermissionDeniedException("Cannot move folder into another user's directory")
                folder.parent_id = new_parent.id

        db.commit()
        db.refresh(folder)
        return folder

    @staticmethod
    def trash_folder(db: Session, user: User, folder_id: str) -> bool:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if not folder:
            raise ResourceNotFoundException("Folder")
        if folder.owner_id != user.id:
            raise PermissionDeniedException("Cannot delete folder owned by another user")

        now = datetime.now(timezone.utc)

        # Recursively collect all descendant folder IDs
        folder_ids = [folder.id]
        queue = [folder.id]
        while queue:
            curr = queue.pop(0)
            children = db.query(Folder.id).filter(Folder.parent_id == curr, Folder.is_trashed == False).all()
            for child in children:
                folder_ids.append(child[0])
                queue.append(child[0])

        # Soft delete folders
        db.query(Folder).filter(Folder.id.in_(folder_ids)).update(
            {"is_trashed": True, "trashed_at": now},
            synchronize_session=False
        )

        # Soft delete files inside these folders
        db.query(File).filter(File.folder_id.in_(folder_ids)).update(
            {"is_trashed": True, "trashed_at": now},
            synchronize_session=False
        )

        db.commit()
        return True

    @staticmethod
    def restore_folder(db: Session, user: User, folder_id: str) -> bool:
        folder = db.query(Folder).filter(Folder.id == folder_id, Folder.is_trashed == True).first()
        if not folder:
            raise ResourceNotFoundException("Folder in trash")
        if folder.owner_id != user.id:
            raise PermissionDeniedException()

        folder_ids = [folder.id]
        queue = [folder.id]
        while queue:
            curr = queue.pop(0)
            children = db.query(Folder.id).filter(Folder.parent_id == curr).all()
            for child in children:
                folder_ids.append(child[0])
                queue.append(child[0])

        db.query(Folder).filter(Folder.id.in_(folder_ids)).update(
            {"is_trashed": False, "trashed_at": None},
            synchronize_session=False
        )

        db.query(File).filter(File.folder_id.in_(folder_ids)).update(
            {"is_trashed": False, "trashed_at": None},
            synchronize_session=False
        )

        db.commit()
        return True
