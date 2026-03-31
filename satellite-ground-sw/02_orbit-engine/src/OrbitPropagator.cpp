#include "OrbitPropagator.h"

std::vector<PropagationPoint> OrbitPropagator::Propagate(
    const StateVector& initial_state, 
    double duration, 
    double step
) const 
{
    if(duration <= 0.0) {
        throw std::runtime_error("duration sec must be positive.");
    }

    if(step <= 0.0) {
        throw std::runtime_error("step sec must be positive.");
    }

    std::vector<PropagationPoint> trajectory;

    StateVector current = initial_state;
    double current_time = 0.0;

    trajectory.push_back({current_time, current});

    while(current_time < duration) {
        double dt = step;

        if(current_time + dt > duration) {
            dt = duration - current_time;
        }

        current = RK4Step(current, dt);
        current_time += dt;

        trajectory.push_back({current_time, current});
    }

    return trajectory;
}

StateVector OrbitPropagator::AddScaled(const StateVector& state, const Derivative& deriv, double dt) const {
    StateVector result;
    result.position = state.position + deriv.dpos * dt;
    result.velocity = state.velocity + deriv.dvel * dt;
    return result;
}

Vector3 OrbitPropagator::ComputeAcceleration(const Vector3& position) const {
    const double r = position.Norm();

    if(r <= 0.0) {
        throw std::runtime_error("Invalid position magnitude: radius must be positive.");
    }

    // 중력 가속도 계산 : -(지구 중력 상수 / (r^3)) * r
    const double factor = -kEarthMuKm3PerSec / (r * r * r);
    return position * factor;
}

StateVector OrbitPropagator::RK4Step(const StateVector& current_state, double dt) const {
    auto evaluate = [this](const StateVector& state) -> Derivative {
        Derivative d;
        d.dpos = state.velocity;
        d.dvel = ComputeAcceleration(state.position);
        return d;
    };

    // k1 = 현재 상태 기준, k2 = 중간 상태, k3 = 다음 중간 상태, k4 = 끝 상태
    const Derivative k1 = evaluate(current_state);
    const Derivative k2 = evaluate(AddScaled(current_state, k1, dt * 0.5));
    const Derivative k3 = evaluate(AddScaled(current_state, k2, dt * 0.5));
    const Derivative k4 = evaluate(AddScaled(current_state, k3, dt * 0.5));

    StateVector next_state;
    next_state.position = current_state.position + (k1.dpos + k2.dpos * 2.0 + k3.dpos * 2.0 + k4.dpos) * (dt / 6.0);
    next_state.velocity = current_state.velocity + (k1.dvel + k2.dvel * 2.0 + k3.dvel * 2.0 + k4.dvel) * (dt / 6.0);

    return next_state;
}