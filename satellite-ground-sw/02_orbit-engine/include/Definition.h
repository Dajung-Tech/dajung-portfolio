struct Vector3 {
    double x;
    double y;
    double z;
};

/// @brief 위치, 속도 데이터
struct StateVector {
    Vector3 position;
    Vector3 velocity;
};

struct PropagationPoint {
    double time;            //unit : sec(seconds)
    StateVector state;
};