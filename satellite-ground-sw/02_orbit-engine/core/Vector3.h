#pragma once

#include <cmath>

class Vector3 {
public:
    Vector3();
    Vector3(double x_val, double y_val, double z_val);

    Vector3 operator+(const Vector3& other) const;
    Vector3 operator-(const Vector3& other) const;
    Vector3 operator*(double scalar) const;
    Vector3 operator/(double scalar) const;

public:
    double Norm() const;
    double getX() const;
    double getY() const;
    double getZ() const;

private:
    double x;
    double y;
    double z;
};