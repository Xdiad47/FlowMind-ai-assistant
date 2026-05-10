# backend/services/auth_service.py
import firebase_admin.firestore
from backend.models.user import UserProfile
from backend.services.key_vault_service import decrypt_api_key

async def get_user_profile(user_id: str) -> UserProfile | None:
    db = firebase_admin.firestore.client()
    doc = db.collection('users').document(user_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    data['id'] = doc.id
    return UserProfile(**data)

async def update_user_profile(user_id: str, data: dict) -> None:
    db = firebase_admin.firestore.client()
    db.collection('users').document(user_id).set(data, merge=True)

async def get_user_api_key(user_id: str) -> tuple[str, str] | None:
    db = firebase_admin.firestore.client()
    doc = db.collection('users').document(user_id).get()
    if not doc.exists:
        return None
    
    data = doc.to_dict()
    provider = data.get('api_provider')
    encrypted_key = data.get('api_key_encrypted')
    
    if not provider or not encrypted_key:
        return None
        
    try:
        decrypted_key = decrypt_api_key(encrypted_key, user_id)
        return provider, decrypted_key
    except ValueError:
        return None

async def check_action_limit(user_id: str, plan: str) -> bool:
    if plan != 'free':
        return True
        
    db = firebase_admin.firestore.client()
    user_ref = db.collection('users').document(user_id)
    
    @firebase_admin.firestore.transactional
    def update_in_transaction(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if not snapshot.exists:
            return False
            
        data = snapshot.to_dict() or {}
        actions = data.get('actions_this_month', 0)
        if actions >= 100:
            return False
            
        transaction.update(ref, {'actions_this_month': actions + 1})
        return True
        
    transaction = db.transaction()
    return update_in_transaction(transaction, user_ref)
