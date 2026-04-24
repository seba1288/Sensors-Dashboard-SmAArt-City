from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from models import db, Sensor, SensorData, Alert, BatteryStatus

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
@login_required
def dashboard():
    total_sensors = Sensor.query.count()
    active_alerts = Alert.query.filter_by(status='active').all()
    # Simple logic for online/offline (mocked via alerts for now)
    offline_count = Alert.query.filter_by(status='active', type='offline').count()
    online_sensors = total_sensors - offline_count
    
    return render_template('index.html', 
                           total_sensors=total_sensors, 
                           online_sensors=online_sensors,
                           alerts=active_alerts)

@main_bp.route('/sensors')
@login_required
def sensors_list():
    sensors = Sensor.query.all()
    return render_template('sensors.html', sensors=sensors)

@main_bp.route('/sensor/add', methods=['GET', 'POST'])
@login_required
def add_sensor():
    if request.method == 'POST':
        sensor_id = request.form['id']
        name = request.form['name']
        type_ = request.form['type']
        location = request.form['location']
        
        new_sensor = Sensor(id=sensor_id, name=name, type=type_, location=location)
        db.session.add(new_sensor)
        db.session.commit()
        flash('Sensor added successfully!')
        return redirect(url_for('main.sensors_list'))
    
    return render_template('add_sensor.html')

@main_bp.route('/sensor/<string:sensor_id>')
@login_required
def sensor_detail(sensor_id):
    sensor = Sensor.query.get_or_404(sensor_id)
    recent_data = SensorData.query.filter_by(sensor_id=sensor_id).order_by(SensorData.timestamp.desc()).limit(10).all()
    recent_alerts = Alert.query.filter_by(sensor_id=sensor_id).order_by(Alert.timestamp.desc()).limit(5).all()
    battery = BatteryStatus.query.filter_by(sensor_id=sensor_id).order_by(BatteryStatus.timestamp.desc()).first()
    
    return render_template('sensor_detail.html', sensor=sensor, recent_data=recent_data, alerts=recent_alerts, battery=battery)