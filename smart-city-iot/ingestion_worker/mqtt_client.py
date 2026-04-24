import os
from dotenv import load_dotenv

import paho.mqtt.client as mqtt
import json
import time
from app import create_app
from models import db
from services.logic import normalize_and_store_data

load_dotenv()

# Configuration
BROKER = os.getenv("MQTT_BROKER", "eu1.cloud.thethings.network")
PORT = int(os.getenv("MQTT_PORT", 1883))
TOPIC = os.getenv("MQTT_TOPIC", "v3/+/devices/+/up")
USERNAME = os.getenv("MQTT_USERNAME", "application-name@ttn")
PASSWORD = os.getenv("MQTT_PASSWORD", "NNSXS.your-api-key")

app = create_app()

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT broker with result code {rc}")
    client.subscribe(TOPIC)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        device_id = payload.get('end_device_ids', {}).get('device_id')
        
        if not device_id:
            return
            
        decoded_payload = payload.get('uplink_message', {}).get('decoded_payload', {})
        
        data_to_store = {
            'metrics': decoded_payload,
            'battery': {}
        }
        
        # Optional: Extract battery data if sent in standard payload
        if 'battery' in decoded_payload:
            data_to_store['battery']['percentage'] = decoded_payload.pop('battery')
        if 'voltage' in decoded_payload:
            data_to_store['battery']['voltage'] = decoded_payload.pop('voltage')

        with app.app_context():
            normalize_and_store_data(device_id, data_to_store)
            
        print(f"Stored data for {device_id}")

    except Exception as e:
        print(f"Error processing message: {e}")

if __name__ == '__main__':
    client = mqtt.Client()
    client.username_pw_set(USERNAME, PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message

    print("Connecting to TTI broker...")
    try:
        client.connect(BROKER, PORT, 60)
        client.loop_forever()
    except KeyboardInterrupt:
        print("Disconnecting...")
        client.disconnect()