from models import db, Sensor, SensorData, BatteryStatus, Alert
from datetime import datetime, timedelta

def normalize_and_store_data(device_id, payload):
    sensor = Sensor.query.get(device_id)
    if not sensor:
        # Auto-create basic sensor entry or log error
        sensor = Sensor(id=device_id, name=f"Unknown-{device_id}", type="Unknown")
        db.session.add(sensor)
        db.session.commit()

    # Process metrics
    for parameter, value in payload.get('metrics', {}).items():
        data_entry = SensorData(
            sensor_id=device_id,
            parameter=parameter,
            value=value,
            unit=get_unit_for(parameter)
        )
        db.session.add(data_entry)

    # Process battery
    if 'battery' in payload:
        batt_data = payload['battery']
        voltage = batt_data.get('voltage')
        percent = batt_data.get('percentage')
        method = 'direct'
        
        if percent is None and voltage is not None:
            # Fallback estimation logic
            percent = estimate_battery_percentage(voltage, sensor.battery_type)
            method = 'voltage_estimation'
            
        if percent is not None or voltage is not None:
            batt_entry = BatteryStatus(
                sensor_id=device_id,
                battery_percentage=percent,
                battery_voltage=voltage,
                estimation_method=method
            )
            db.session.add(batt_entry)
            
            # Check for low battery alert
            if percent is not None and percent < 20.0:
                create_alert(device_id, 'low_battery', 'high', f'Battery is at {percent}%')

    db.session.commit()

def estimate_battery_percentage(voltage, battery_type):
    # Simplified estimation
    if voltage >= 3.3: return 100.0
    if voltage <= 2.8: return 0.0
    return ((voltage - 2.8) / (3.3 - 2.8)) * 100

def get_unit_for(parameter):
    units = {'temperature': '°C', 'humidity': '%', 'pressure': 'hPa'}
    return units.get(parameter, '')

def create_alert(sensor_id, alert_type, severity, message):
    # Check if active alert already exists to prevent duplicates
    existing = Alert.query.filter_by(sensor_id=sensor_id, type=alert_type, status='active').first()
    if not existing:
        alert = Alert(sensor_id=sensor_id, type=alert_type, severity=severity, message=message)
        db.session.add(alert)

def check_offline_sensors():
    # Example logic to run periodically
    cutoff = datetime.utcnow() - timedelta(hours=2)
    sensors = Sensor.query.all()
    for sensor in sensors:
        last_data = SensorData.query.filter_by(sensor_id=sensor.id).order_by(SensorData.timestamp.desc()).first()
        if last_data and last_data.timestamp < cutoff:
            create_alert(sensor.id, 'offline', 'critical', 'Sensor has not reported for over 2 hours')
    db.session.commit()