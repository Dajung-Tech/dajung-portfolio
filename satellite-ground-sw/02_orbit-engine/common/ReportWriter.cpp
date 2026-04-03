#include "ReportWriter.h"

bool ReportWriter::WriteCsv(const std::string& path, const std::vector<double>& time, const std::vector<GeodeticPoint>& ground_track) {
    if(time.size() != ground_track.size()) {
        return false;
    }

    std::ofstream ofs(path);
    if(!ofs.is_open()) {
        return false;
    }

    ofs << "time_sec, latitude, longitude, altitude\n";
    ofs << std::fixed << std::setprecision(6);

    for(size_t i=0; i < ground_track.size(); ++i) {
        ofs << time[i] << ","
            << ground_track[i].latitude << ","
            << ground_track[i].longitude << ","
            << ground_track[i].altitude << "\n";
    }
    
    return true;
}