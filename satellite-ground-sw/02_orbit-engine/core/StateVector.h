#pragma once

#include "Vector3.h"

/// @brief 위치 속도 데이터
struct StateVector {
    Vector3 position;       //unit : km
    Vector3 velocity;       //unit : km/s
};