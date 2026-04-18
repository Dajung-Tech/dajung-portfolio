#include "ImageUtils.h"
#include <QColor>

cv::Mat ImageUtils::qImageToMat(const QImage& image) {
    QImage converted = image.convertToFormat(QImage::Format_RGB888);

    cv::Mat mat(
        converted.height(),
        converted.width(),
        CV_8UC3,
        const_cast<uchar*>(converted.bits()),
        converted.bytesPerLine()
        );

    cv::Mat matCopy = mat.clone();
    cv::cvtColor(matCopy, matCopy, cv::COLOR_RGB2BGR);
    return matCopy;
}

QImage ImageUtils::matToQImage(const cv::Mat& mat) {
    if(mat.empty()){
        return QImage();
    }

    if(mat.type() == CV_8UC1) {
        QImage image(
            mat.data,
            mat.cols,
            mat.rows,
            static_cast<int>(mat.step),
            QImage::Format_Grayscale8
        );
        return image.copy();
    }

    if(mat.type() == CV_8UC3) {
        cv::Mat rgb;
        cv::cvtColor(mat, rgb, cv::COLOR_BGR2RGB);

        QImage image(
            rgb.data,
            rgb.cols,
            rgb.rows,
            static_cast<int>(rgb.step),
            QImage::Format_RGB888
        );
        return image.copy();
    }

    if(mat.type() == CV_8UC4) {
        QImage image(
            mat.data,
            mat.cols,
            mat.rows,
            static_cast<int>(mat.step),
            QImage::Format_ARGB32
            );
        return image.copy();
    }

    return QImage();
}