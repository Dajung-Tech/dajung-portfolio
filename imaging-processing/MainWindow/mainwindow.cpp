#include "mainwindow.h"
#include "ui_mainwindow.h"

#include <QFileDialog>
#include <QMessageBox>
#include <QPixmap>
#include <QColor>
#include <QDebug>

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);

    connect(ui->openButton, &QPushButton::clicked, this, &MainWindow::onOpenClicked);
    connect(ui->saveButton, &QPushButton::clicked, this, &MainWindow::onSaveClicked);
    connect(ui->resetButton, &QPushButton::clicked, this, &MainWindow::onResetClicked);

    // preprocessing
    connect(ui->grayscaleButton, &QPushButton::clicked, this, &MainWindow::onGrayscaleClicked);
    connect(ui->gaussianBlurButton, &QPushButton::clicked, this, &MainWindow::onGaussianBlurClicked);
    connect(ui->sharpenButton, &QPushButton::clicked, this, &MainWindow::onSharpenClicked);
    connect(ui->medianFilterButton, &QPushButton::clicked, this, &MainWindow::onMedianFilterClicked);
    connect(ui->histEqButton, &QPushButton::clicked, this, &MainWindow::onHistEqClicked);

    ui->statusLabel->setText("Status: Ready");
    ui->logTextEdit->setPlainText("Application started.");

}

MainWindow::~MainWindow()
{
    delete ui;
}

void MainWindow::onOpenClicked() {
    QString filePath = QFileDialog::getOpenFileName(
        this,
        "Open Image",
        "",
        "Images (*.png *.jpg *.jpeg *.bmp)"
        );

    if(filePath.isEmpty()){
        return;
    }

    QImage image(filePath);
    if(image.isNull()){
        QMessageBox::warning(this, "Error", "이미지를 불러오지 못했습니다.");
        ui->logTextEdit->appendPlainText("[Error] Load Image");
        return;
    }

    originalImage_ = image;
    resultImage_ = image;

    ui->statusLabel->setText("Status: Image Loaded");
    ui->logTextEdit->appendPlainText("Load image: " + filePath);

    updateImageViews();
}

void MainWindow::onSaveClicked() {
    if(resultImage_.isNull()){
        QMessageBox::information(this, "Info", "저장할 결과 이미지가 없습니다.");
        return;
    }

    QString filePath = QFileDialog::getSaveFileName(
        this,
        "Save Image",
        "",
        "PNG Image (*.png);;JPEG Image (*.jpg *.jpeg);;Bitmap Image(*.bmp)"
        );
    if(filePath.isEmpty()) {
        return;
    }

    if(!resultImage_.save(filePath)){
        QMessageBox::warning(this, "Error", "이미지 저장에 실패했습니다.");
        return;
    }

    ui->statusLabel->setText("Status: Image Saved");
    ui->logTextEdit->appendPlainText("Saved image: " + filePath);
}

void MainWindow::onResetClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = originalImage_;

    ui->statusLabel->setText("Status: Reset");
    ui->logTextEdit->appendPlainText("Reset result image to original.");

    updateImageViews();
}

int MainWindow::clamp(int value, int minValue, int maxValue) {
    if(value < minValue) return minValue;
    if(value > maxValue) return maxValue;

    return value;
}

// preprocessing
void MainWindow::onGrayscaleClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = toGrayscale(originalImage_);

    ui->statusLabel->setText("Status: Grayscale Applied");
    ui->logTextEdit->appendPlainText("Applied grayscale.");

    updateImageViews();
}

void MainWindow::onGaussianBlurClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = applyBoxBlur(originalImage_);

    ui->statusLabel->setText("Status: Gaussian Blur Applied");
    ui->logTextEdit->appendPlainText("Applied Gaussian Blur (temporary box blur).");

    updateImageViews();
}

void MainWindow::onSharpenClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = applySharpen(originalImage_);

    ui->statusLabel->setText("Status: Sharpening Applied");
    ui->logTextEdit->appendPlainText("Applied sharpening.");

    updateImageViews();
}

void MainWindow::onMedianFilterClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = applyMedianFilter(originalImage_);

    ui->statusLabel->setText("Status: Median Filter Applied");
    ui->logTextEdit->appendPlainText("Applied median filter.");

    updateImageViews();
}

void MainWindow::onHistEqClicked() {
    if(originalImage_.isNull()) {
        QMessageBox::information(this, "Info", "먼저 이미지를 열어주세요.");
        return;
    }

    resultImage_ = applyHistogramEqualization(originalImage_);

    ui->statusLabel->setText("Status: Histogram Equalization Applied");
    ui->logTextEdit->appendPlainText("Applied histogram equalization.");

    updateImageViews();
}

void MainWindow::updateImageViews() {
    ui->originalLabel->clear();
    ui->resultLabel->clear();

    if(!originalImage_.isNull()) {
        QPixmap originalPixmap = QPixmap::fromImage(originalImage_);
        ui->originalLabel->setPixmap(
            originalPixmap.scaled(
                ui->originalLabel->size(),
                Qt::KeepAspectRatio,
                Qt::SmoothTransformation
                )
            );
    } else {
        ui->originalLabel->setText("Original Image");
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
    }else {
        ui->resultLabel->setText("Result Image");
    }
}

// preprocessing
QImage MainWindow::toGrayscale(const QImage& input) {
    QImage src = input.convertToFormat(QImage::Format_RGB32);
    QImage gray(src.size(), QImage::Format_RGB32);

    for(int y = 0; y < src.height(); ++y) {
        for(int x = 0; x < src.width(); ++x) {
            QColor color = src.pixelColor(x,y);

            int grayValue = static_cast<int> (
                0.299 * color.red() +
                0.587 * color.green() +
                0.114 * color.blue()
                );

            gray.setPixelColor(x,y, QColor(grayValue, grayValue, grayValue));
        }
    }

    return gray;
}

QImage MainWindow::applyBoxBlur(const QImage& input) {
    QImage src = input.convertToFormat(QImage::Format_RGB32);
    QImage dst(src.size(), QImage::Format_RGB32);

    int width = src.width();
    int height = src.height();

    for(int y = 0; y < height; ++y) {
        for(int x = 0; x < width; ++x) {
            int redSum = 0;
            int greenSum = 0;
            int blueSum = 0;
            int count = 0;

            // 커널 사이즈 : 3x3
            for(int dy = -1; dy <= 1; ++dy) {
                for(int dx = -1; dx <= 1; ++dx) {
                    int nx = x + dx;
                    int ny = y + dy;

                    if(nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        QColor color = src.pixelColor(nx, ny);

                        redSum += color.red();
                        greenSum += color.green();
                        blueSum += color.blue();
                        count++;
                    }
                }
            }

            int avgRed = redSum / count;
            int avgGreen = greenSum / count;
            int avgBlue = blueSum / count;

            dst.setPixelColor(x, y, QColor(avgRed, avgGreen, avgBlue));
        }
    }
    return dst;
}

QImage MainWindow::applySharpen(const QImage& input) {
    QImage src = input.convertToFormat(QImage::Format_RGB32);
    QImage dst(src.size(), QImage::Format_RGB32);

    int width = src.width();
    int height = src.height();

    int kernel[3][3] = {
        {0, -1, 0},
        {-1, 5, -1},
        {0, -1, 0}
    };

    for(int y = 0; y < height; ++y) {
        for(int x = 0; x< width; ++x) {
            int redSum = 0;
            int greenSum = 0;
            int blueSum = 0;

            for(int dy = -1; dy <= 1; ++dy) {
                for(int dx = -1; dx <= 1; ++dx) {
                    int nx = clamp(x + dx, 0, width -1);
                    int ny = clamp(y + dy, 0, height -1);

                    QColor color = src.pixelColor(nx, ny);
                    int weight = kernel[dy + 1][dx + 1];

                    redSum += color.red() * weight;
                    greenSum += color.green() * weight;
                    blueSum += color.blue() * weight;
                }
            }

            int r = clamp(redSum, 0, 255);
            int g = clamp(greenSum, 0, 255);
            int b = clamp(blueSum, 0, 255);

            dst.setPixelColor(x,y, QColor(r,g,b));
        }
    }

    return dst;
}

QImage MainWindow::applyMedianFilter(const QImage& input) {
    QImage src = input.convertToFormat(QImage::Format_RGB32);
    QImage dst(src.size(), QImage::Format_RGB32);

    int width = src.width();
    int height = src.height();

    for(int y = 0; y < height; ++y){
        for(int x = 0; x < width; ++x) {
            std::vector<int> reds;
            std::vector<int> greens;
            std::vector<int> blues;

            reds.reserve(9);
            greens.reserve(9);
            blues.reserve(9);

            for(int dy = -1; dy <= 1; ++dy) {
                for(int dx = -1; dx <= 1; ++dx) {
                    int nx = clamp(x + dx, 0, width -1);
                    int ny = clamp(y + dy, 0, height - 1);

                    QColor color = src.pixelColor(nx, ny);

                    reds.push_back(color.red());
                    greens.push_back(color.green());
                    blues.push_back(color.blue());
                }
            }

            std::sort(reds.begin(), reds.end());
            std::sort(greens.begin(), greens.end());
            std::sort(blues.begin(), blues.end());

            int r = reds[4];
            int g = greens[4];
            int b = blues[4];

            dst.setPixelColor(x,y,QColor(r,g,b));
        }
    }

    return dst;
}

QImage MainWindow::applyHistogramEqualization(const QImage& input){
    QImage gray = input.convertToFormat(QImage::Format_Grayscale8);
    QImage result(gray.size(), QImage::Format_Grayscale8);

    int width = gray.width();
    int height = gray.height();
    int totalPixels = width * height;

    int histogram[256] = {0};

    for(int y = 0; y < height; ++y) {
        const uchar* line = gray.constScanLine(y);
        for(int x = 0; x < width; ++x) {
            histogram[line[x]]++;
        }
    }

    int cdf[256] = {0};
    cdf[0] = histogram[0];
    for(int i = 1; i < 256; ++i) {
        cdf[i] = cdf[i-1] + histogram[i];
    }

    int cdfMin = 0;
    for(int i = 0; i < 256; ++i) {
        if(cdf[i] != 0) {
            cdfMin = cdf[i];
            break;
        }
    }

    uchar lut[256];
    for(int i =0; i<256; ++i) {
        if(totalPixels == cdfMin) {
            lut[i] = static_cast<uchar>(i);
        } else {
            double value = static_cast<double>(cdf[i] - cdfMin) / static_cast<double>(totalPixels - cdfMin);
            int mapped = static_cast<int>(value * 255.0);
            lut[i] = static_cast<uchar>(clamp(mapped, 0, 255));
        }
    }

    for(int y = 0; y < height; ++y) {
        const uchar* srcLine = gray.constScanLine(y);
        uchar* dstLine = result.scanLine(y);

        for(int x = 0; x < width; ++x) {
            dstLine[x] = lut[srcLine[x]];
        }
    }

    return result.convertToFormat(QImage::Format_RGB32);
}