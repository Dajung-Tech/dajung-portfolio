#include "mainwindow.h"
#include "ui_mainwindow.h"

#include <QFileDialog>
#include <QMessageBox>
#include <QPixmap>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    connect(ui->openButton, &QPushButton::clicked, this, &MainWindow::onOpenClicked);
    connect(ui->grayscaleButton, &QPushButton::clicked, this, &MainWindow::onGrayscaleClicked);
    connect(ui->saveButton, &QPushButton::clicked, this, &MainWindow::onSaveClicked);
}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::onOpenClicked() {
    QString filePath = QFileDialog::getOpenFileName(
        this, "Open Image", "", "Images (*.png *.jpg *.jpeg *.bmp");

    if(filePath.isEmpty()){
        return;
    }

    QImage image(filePath);
    if(image.isNull()) {
        QMessageBox::warning(this, "Error", "이미지를 불러오지 못했습니다.");
        return;
    }

    originalImage_ = image;
    resultImage_ = image;

    updateImageViews();
}

void MainWindow::onGrayscaleClicked(){
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = toGrayscale(originalImage_);
    updateImageViews();
}

void MainWindow::onSaveClicked(){
    if(resultImage_.isNull()) {
        QMessageBox::information(this, "Info", "저장할 결과 이미지가 없습니다.");
        return;
    }

    QString filePath = QFileDialog::getSaveFileName(this, "Save Image", "", "PNG Image (*.png);;JPEG Image(*.jpg, *.jpeg);;Bitmap Image (*.bmp)");
    if(filePath.isEmpty()){
        return;
    }

    if(!resultImage_.save(filePath)) {
        QMessageBox::warning(this, "Error", "이미지 저장에 실패했습니다.");
        return;
    }

    QMessageBox::information(this, "Saved", "이미지를 저장했습니다.");
}

void MainWindow::updateImageViews() {
    if(!originalImage_.isNull()) {
        QPixmap originalPixmap = QPixmap::fromImage(originalImage_);
        ui->originalLabel->setPixmap(
            originalPixmap.scaled(
                ui->originalLabel->size(),
                Qt::KeepAspectRatio,
                Qt::SmoothTransformation
                )
            );

    }

    if(!resultImage_.isNull()) {
        QPixmap resultPixmap = QPixmap::fromImage(resultImage_);
        ui->resultLabel->setPixmap(
            resultPixmap.scaled(
                ui->resultLabel->size(),
                Qt::KeepAspectRatio,
                Qt::SmoothTransformation
                )
            );
    }
}

QImage MainWindow::toGrayscale(const QImage& input) {
    QImage grayImage = input.convertToFormat(QImage::Format_Grayscale8);
    return grayImage;
}
