# SmAArt City – User Manual (Technical Overview)

## Overview
SmAArt City is a Smart City Sensor Operations Platform that transforms sensor data into clear, actionable insights.

It helps teams:
- Detect issues quickly
- Understand root causes
- Take action faster
- Reduce investigation time

---

## Architecture Summary

The system includes:

- Frontend Dashboard (UI)
- Data Ingestion (MQTT + APIs)
- Processing Layer (normalization + diagnostics)
- Storage (sensor data + alerts)

---

## Core Problems Addressed

| Pain Point | Solution |
|-----------|---------|
| Data inconsistency | Unified schema |
| No clear status | Status inference |
| Unknown root cause | Diagnostics engine |
| False alerts | Smart status logic |
| Weak workflows | Alerts + assignment |
| Battery unclear | Battery estimation |
| Scalability issues | Filtering + zones |

---

## 1. Unified Data Schema

### Problem
Different sensors send different formats such as:
- temp
- temperature
- t

---

### Solution

All data is normalized into a standard structure:

{
  "sensor_id": "sensor_123",
  "timestamp": "2026-01-01T12:00:00Z",
  "parameters": [
    {
      "name": "temperature",
      "value": 22.1,
      "unit": "°C"
    }
  ]
}

---

### Benefits
- Standardized data
- Easier analysis
- Consistent UI
- Cross-sensor comparison

---

## 2. Data Ingestion

### Sources:
- MQTT (LoRaWAN / TTI)
- REST APIs

### Process:
1. Receive data
2. Decode payload
3. Normalize data
4. Store in database
5. Trigger diagnostics

---

## 3. Status Inference

Sensors do not always report their real status.

We calculate status using:
- Last data received
- Expected reporting interval

### States:
- Online → recent data received
- Unstable → delayed data
- Offline → no data for extended time

---

## 4. Root Cause Diagnosis

System analyzes:
- Battery status
- Signal quality (RSSI, SNR)
- Nearby sensors
- Historical behavior

### Example:
- Battery OK
- Signal strong
- Nearby sensors active

→ Likely hardware issue

---

## 5. Battery Intelligence

Supports:
- Percentage
- Voltage
- Estimated lifetime

### Features:
- Voltage to percentage conversion
- Lifetime estimation (months/years)
- Discharge tracking

---

## 6. Signal Quality

Uses:
- RSSI (signal strength)
- SNR (signal clarity)

### Output:
- Excellent
- Strong
- Medium
- Poor

---

## 7. Alerts System

Triggered when:
- Sensor offline
- Battery low
- Signal weak
- Data anomaly

### Each alert includes:
- Issue category
- Urgency level
- Recommended action

---

## 8. Technician Workflow

1. Alert created
2. Assigned to technician
3. Technician notified
4. Technician accepts task
5. Fix applied
6. Status updated
7. Proof uploaded

---

## 9. Data Quality Monitoring

Detects:
- Missing metadata
- Inconsistent readings
- Missing battery data

---

## 10. Scalability

- Add sensors easily
- Group by zones
- Filter and search
- Aggregated insights

---

## Conclusion

SmAArt City transforms:
- Data → Insights
- Alerts → Actions

Goal:
Give teams more time to improve the city.