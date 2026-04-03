#include <iostream>
#include <vector>

#include "../common/ReportWriter.h"
#include "../core/StateVector.h"
#include "../core/CoordinateConverter.h"
#include "OrbitPropagator.h"

int main() {
    try {
        StateVector initial_state;

        // 거의 원형 궤도
        initial_state.position = Vector3(7000.0, 0.0, 0.0);
        initial_state.velocity = Vector3(0.0, 7.546, 0.0);

        const double duration = 5400.0;   // unit : sec
        const double step = 60.0;        // unit : sec
        
        OrbitPropagator propagator;
        std::vector<PropagationPoint> trajectory = propagator.Propagate(initial_state, duration, step);

        std::cout<< "Propagation complete.\n";
        std::cout<<"Generated points: "<<trajectory.size()<<"\n";

        const PropagationPoint& last = trajectory.back();
        std::cout << "Final time: " << last.time << "sec \n";
        std::cout << "Final position (km): "
                << last.state.position.getX() << ", "
                << last.state.position.getY() << ", "
                << last.state.position.getZ() << "\n";
        std::cout << "Final velocity (km/s): "
                << last.state.velocity.getX() << ", "
                << last.state.velocity.getY() << ", "
                << last.state.velocity.getZ() << "\n";
        
        std::cout << "Generated points : " << trajectory.size() << "\n";

        CoordinateConverter converter;
        std::vector<double> time;
        std::vector<GeodeticPoint> ground_track;

        for(const auto& point : trajectory) {
            Vector3 ecef = converter.EciToEcef(point.state.position, point.time);
            GeodeticPoint geo = converter.EcefToGeodetic(ecef);

            time.push_back(point.time);
            ground_track.push_back(geo);
        }

        // csv 파일 저장
        if(ReportWriter::WriteCsv("../output/ground_track.csv", time, ground_track)) {
            std::cout << "ground_track.csv saved. \n";
        }else {
            std::cout << "failed to save ground track. \n";
        }
    } catch(const std::exception& ex) {
        std::cerr << "Error: " << ex.what() << "\n";
        return 1;
    }
    return 0;
}