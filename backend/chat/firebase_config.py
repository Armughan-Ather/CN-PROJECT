# chat/firebase_config.py
import firebase_admin
from firebase_admin import credentials, storage
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

cred = credentials.Certificate(os.path.join(BASE_DIR, 'firebaseServiceAccountKey.json'))

firebase_admin.initialize_app(cred, {
    'storageBucket': 'cn-project-a2508.appspot.com'  # ✅ NOTE the correct suffix is `.appspot.com`
})
