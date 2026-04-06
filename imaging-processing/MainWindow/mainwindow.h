#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QImage>

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
    void onGrayscaleClicked();
    void onSaveClicked();

private:
    void updateImageViews();
    QImage toGrayscale(const QImage& input);

private:
    Ui::MainWindow *ui;

    // 원본 이미지
    QImage originalImage_;
    // 결과 이미지
    QImage resultImage_;
};
#endif // MAINWINDOW_H
