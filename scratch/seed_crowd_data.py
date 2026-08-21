import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, r'c:\Users\Soumya\Desktop\BACKEND')
import crowd_updates

now = datetime.now(timezone.utc)

reports = [
    {
        "latitude": 20.3001,
        "longitude": 85.8254,
        "update_type": "waterlogging",
        "answer": "YES",
        "description": "Stormwater accumulation up to 45cm at Jaydev Vihar underpass. Traffic moving very slowly.",
        "user_id": "cit-usr-101",
        "ward_id": "18"
    },
    {
        "latitude": 20.3018,
        "longitude": 85.8175,
        "update_type": "road_damage",
        "answer": "YES",
        "description": "Deep trench caved in on Nayapalli Behera Sahi main road after drain reconstruction collapse.",
        "user_id": "cit-usr-102",
        "ward_id": "15"
    },
    {
        "latitude": 20.2970,
        "longitude": 85.8740,
        "update_type": "power_outage",
        "answer": "YES",
        "description": "Power supply interrupted across Rasulgarh Industrial Gate Lane 4 following transformer spark.",
        "user_id": "cit-usr-103",
        "ward_id": "11"
    },
    {
        "latitude": 20.2785,
        "longitude": 85.8421,
        "update_type": "waterlogging",
        "answer": "YES",
        "description": "Waterlogging up to 60cm near Bomikhal flyover junction. Drainage clearance required.",
        "user_id": "cit-usr-104",
        "ward_id": "57"
    },
    {
        "latitude": 20.2510,
        "longitude": 85.7890,
        "update_type": "flooding",
        "answer": "YES",
        "description": "Gangua Canal overflow entering residential lanes near Kalinga Nagar Sector K-4.",
        "user_id": "cit-usr-105",
        "ward_id": "59"
    },
    {
        "latitude": 20.2798,
        "longitude": 85.7925,
        "update_type": "road_blocked",
        "answer": "YES",
        "description": "Tree branch fallen near Baramunda ISBT terminal departure gate. One lane blocked.",
        "user_id": "cit-usr-106",
        "ward_id": "35"
    }
]

created_list = []
for r in reports:
    created = crowd_updates.submit_crowd_update(**r)
    created_list.append(created)
    print(f"Created: {created.get('id')} | Ward: {created.get('ward_id')} | Type: {created.get('update_type')}")

print(f"Successfully seeded {len(created_list)} realistic citizen reports.")
