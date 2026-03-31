#include "CoordinateConverter.h"

Vector3 CoordinateConverter::EciToEcef(const Vector3& eci_position, double time) const {
    const double theta = kEarthRotationRateRadPerSec * time;

    const double cos_theta = std::cos(theta);
    const double sin_theta = std::sin(theta);

    const double x = cos_theta * eci_position.getX() + sin_theta * eci_position.getY();
    const double y = -sin_theta * eci_position.getX() + cos_theta * eci_position.getY();
    const double z = eci_position.getZ();

    return Vector3(x,y,z);
}

GeodeticPoint CoordinateConverter::EcefToGeodetic(const Vector3& ecef_position) const {
    const double x = ecef_position.getX();
    const double y = ecef_position.getY();
    const double z = ecef_position.getZ();

    const double r_xy = std::sqrt(x * x + y * y);
    const double r = std::sqrt(x * x + y * y + z * z);

    const double latitude = std::atan2(z, r_xy);
    const double longitude = std::atan2(y, x);
    const double altitude = r - kEarthRadius;

    GeodeticPoint point;
    point.latitude = latitude * kRadToDeg;
    point.longitude = longitude * kRadToDeg;
    point.altitude = altitude;

    return point;
}