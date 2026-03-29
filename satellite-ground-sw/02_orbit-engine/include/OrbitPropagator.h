#include "Definition.h"
#include <vector>

class OrbitPropagator {
public:
    std::vector<PropagationPoint> Propagate(
        const StateVector& initial_state, 
        double duration,                    //unit : sec(seconds)
        double step                         //unit : sec(seconds)
    ) const;
};