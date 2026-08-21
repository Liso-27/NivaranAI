from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.id import ID
import os

client = Client()
client.set_endpoint("https://sgp.cloud.appwrite.io/v1")
client.set_project("6a842a71002b825e7612")
client.set_key(os.environ.get("APPWRITE_API_KEY"))

databases = Databases(client)

result = databases.create_document(
    database_id="6a842ad90015884d7d96",
    collection_id="reports",
    document_id=ID.unique(),
    data={
        "ward_id": "ward_1",
        "hazard_type": "waterlogging",
        "description": "test report",
        "latitude": 20.2961,
        "longitude": 85.8245,
        "status": "active",
        "confirm_count": 0,
    },
)

print("SUCCESS")
print(result)
