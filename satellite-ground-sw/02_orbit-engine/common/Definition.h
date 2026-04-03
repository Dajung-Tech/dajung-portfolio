#pragma once

#include "../core/Vector3.h"
#include "../core/StateVector.h"

/// @brief 궤도 전파 결과 
struct PropagationPoint {
    double time;            //unit : sec(seconds)
    StateVector state;
};

/// @brief 좌표 표현
struct GeodeticPoint {
    double latitude;        //unit : deg
    double longitude;       //unit : deg
    double altitude;        //unit : km
};