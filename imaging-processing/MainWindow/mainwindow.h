#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QImage>
#include <algorithm>
#include <vector>
#include <QPointF>

QT_BEGIN_NAMESPACE
namespace Ui {
class MainWindow;
}
QT_END_NAMESPACE

class MainWindow : public QMainWindow
{
    Q_OBJECT

public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow() override;

private slots:
    void onOpenClicked();
    void onSaveClicked();
    void onResetClicked();

    // preprocessing
    void onGrayscaleClicked();
    void onGaussianBlurClicked();
    void onSharpenClicked();
    void onMedianFilterClicked();
    void onHistEqClicked();

    // registration
    void onRegisterClicked();

private:
    void updateImageViews();

    // preprocessing
    QImage toGrayscale(const QImage& input);
    QImage applyBoxBlur(const QImage& input);
    QImage applySharpen(const QImage& input);
    QImage applyMedianFilter(const QImage& input);
    QImage applyHistogramEqualization(const QImage& input);
    int clamp(int value, int minValue, int maxValue);

    // registration
    QPointF registerByPhaseCorrelation(const QImage& refImg, const QImage& targetImg);
    QImage shiftImageSubpixel(const QImage& input, double shiftX, double shiftY);
    QImage createOverlayImage(const QImage& ref, const QImage& aligned);

private:
    Ui::MainWindow *ui;

    QImage originalImage_;
    QImage resultImage_;

    double registeredShiftX_ = 0.0;
    double registeredShiftY_ = 0.0;

};
#endif // MAINWINDOW_H
