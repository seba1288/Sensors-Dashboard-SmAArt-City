from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(150), nullable=False)

class Sensor(db.Model):
    id = db.Column(db.String(50), primary_key=True) # unique_id (Device EUI)
    name = db.Column(db.String(150), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(150))
    comm_type = db.Column(db.String(50), default='LoRaWAN')
    battery_type = db.Column(db.String(50))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    data = db.relationship('SensorData', backref='sensor', lazy=True)
    battery_reports = db.relationship('BatteryStatus', backref='sensor', lazy=True)
    alerts = db.relationship('Alert', backref='sensor', lazy=True)

class SensorData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.String(50), db.ForeignKey('sensor.id'), nullable=False, index=True)
    parameter = db.Column(db.String(50), nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class BatteryStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.String(50), db.ForeignKey('sensor.id'), nullable=False, index=True)
    battery_percentage = db.Column(db.Float)
    battery_voltage = db.Column(db.Float)
    estimation_method = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

class Alert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.String(50), db.ForeignKey('sensor.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False) # offline, low_battery, weak_signal
    severity = db.Column(db.String(20), nullable=False)
    message = db.Column(db.String(255))
    status = db.Column(db.String(20), default='active')
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class MaintenanceLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sensor_id = db.Column(db.String(50), db.ForeignKey('sensor.id'), nullable=False)
    operator = db.Column(db.String(100))
    comment = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)