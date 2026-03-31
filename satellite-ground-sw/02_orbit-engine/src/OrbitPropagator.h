#include "../common/Definition.h"

#include <vector>
#include <stdexcept>

/// @brief 초기 상태벡터를 입력받아 RK4 수치 적분을 통해 시간에 따른 상태벡터를 계산하는 모듈,
//         가속도 계산과 적분 로직을 분리하여 확장성과 테스트 용이성을 고려함
class OrbitPropagator {
public:
    struct Derivative {
        Vector3 dpos;
        Vector3 dvel;
    };

    /// @brief 초기 상태 벡터를 통해 궤도 전파 수행
    /// @param initial_state 초기 상태 벡터
    /// @param duration 궤도 전파 시간 (unit : sec)
    /// @param step 궤도 전파 수행 간격 (unit : sec)
    /// @return 
    std::vector<PropagationPoint> Propagate(
        const StateVector& initial_state, 
        double duration,                    
        double step                         
    ) const;

private:
    /// @brief 지구의 중력 상수 (unit: km^3/s^2)
    static constexpr double kEarthMuKm3PerSec = 398600.4418;

    /// @brief 현재 상태에 변화량을 반영하는 함수
    /// @param state 현재 상태
    /// @param deriv 변화량
    /// @param dt 시간 (unit : sec)
    /// @return 
    StateVector AddScaled(const StateVector& state, const Derivative& deriv, double dt) const;

    /// @brief 가속도 계산 함수
    /// @param position 위치 데이터
    /// @return 
    Vector3 ComputeAcceleration(const Vector3& position) const;

    /// @brief Runge-Kutta 4차 수치 적분 함수
    /// @param current_state 현재 상태 벡터
    /// @param dt 
    /// @return 
    StateVector RK4Step(const StateVector& current_state, double dt) const;
};