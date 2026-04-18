#ifndef IMAGEUTILS_H
#define IMAGEUTILS_H

#include <QImage>
#include <opencv2/opencv.hpp>

class ImageUtils{
public:
    static cv::Mat qImageToMat(const QImage& image);
    static QImage matToQImage(const cv::Mat& mat);
};

#endif // IMAGEUTILS_H
