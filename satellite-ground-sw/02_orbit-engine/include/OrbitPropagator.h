#include "Definition.h"
#include <vector>

class OrbitPropagator {
public:
    /// @brief 궤도 전파를 수행합니다.
    /// @param initial_state
    /// @param duration 궤도 전파 시간 (unit : sec)
    /// @param step 궤도 전파 수행 간격 (unit : sec)
    /// @return 
    std::vector<PropagationPoint> Propagate(
        const StateVector& initial_state, 
        double duration,                    
        double step                         
    ) const;
};