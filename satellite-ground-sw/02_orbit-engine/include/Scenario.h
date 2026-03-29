#include "Definition.h"

#include <string>

/// @brief 
struct Scenario {
    StateVector object_a;
    StateVector object_b;
    double duration;                //unit : sec(seconds)
    double step;                    //unit : sec(seconds)
    double collision_threshold;     //unit : km(kilometer)
};

class ScenarioLoader{
public:
    Scenario LoadFromFile(const std::string& path) const;
};