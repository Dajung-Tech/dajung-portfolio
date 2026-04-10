#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QImage>
#include <algorithm>
#include <vector>

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

private:
    void updateImageViews();

    // preprocessing
    QImage toGrayscale(const QImage& input);
    QImage applyBoxBlur(const QImage& input);
    QImage applySharpen(const QImage& input);
    QImage applyMedianFilter(const QImage& input);
    QImage applyHistogramEqualization(const QImage& input);
    int clamp(int value, int minValue, int maxValue);

private:
    Ui::MainWindow *ui;

    QImage originalImage_;
    QImage resultImage_;

};
#endif // MAINWINDOW_H
