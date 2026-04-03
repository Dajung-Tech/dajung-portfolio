#pragma once

#include "../common/Definition.h"
#include "Vector3.h"

#include <cmath>

class CoordinateConverter {
public:
    /// @brief ECI -> ECEF 좌표계 변환
    /// @param eci_position ECI 좌표계에서의 위치 값 (unit : km)
    /// @param time ECI 좌표에서의 시각 (unit : sec)
    /// @return 
    Vector3 EciToEcef(const Vector3& eci_position, double time) const;

    /// @brief ECEF -> Lat/Lon 좌표계 변환
    /// @param ecef_position ECEF 좌표계에서의 위치 값 (unit : km)
    /// @return 
    GeodeticPoint EcefToGeodetic(const Vector3& ecef_position) const;

private:
    //지구 자전 속도 (unit : rad/sec)
    static constexpr double kEarthRotationRateRadPerSec = 7.2921159e-5;

    //지구 반지름 (구형 모델로 가정)
    static constexpr double kEarthRadius = 6378.137;

    static constexpr double kPi = 3.1415926535897932384626;
    static constexpr double kRadToDeg = 180.0 / kPi;
};