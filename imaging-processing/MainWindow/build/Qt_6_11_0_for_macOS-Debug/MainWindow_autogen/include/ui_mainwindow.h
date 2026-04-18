/********************************************************************************
** Form generated from reading UI file 'mainwindow.ui'
**
** Created by: Qt User Interface Compiler version 6.11.0
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_MAINWINDOW_H
#define UI_MAINWINDOW_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QMainWindow>
#include <QtWidgets/QMenuBar>
#include <QtWidgets/QPlainTextEdit>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QSlider>
#include <QtWidgets/QStatusBar>
#include <QtWidgets/QTabWidget>
#include <QtWidgets/QVBoxLayout>
#include <QtWidgets/QWidget>

QT_BEGIN_NAMESPACE

class Ui_MainWindow
{
public:
    QWidget *centralwidget;
    QVBoxLayout *verticalLayout;
    QWidget *topBarWidget;
    QHBoxLayout *horizontalLayout;
    QPushButton *openButton;
    QPushButton *saveButton;
    QPushButton *resetButton;
    QWidget *widget;
    QLabel *statusLabel;
    QWidget *centerWidget;
    QHBoxLayout *horizontalLayout_2;
    QTabWidget *mainTabWidget;
    QWidget *Preprocessing;
    QVBoxLayout *verticalLayout_2;
    QPushButton *grayscaleButton;
    QPushButton *gaussianBlurButton;
    QPushButton *medianFilterButton;
    QPushButton *histEqButton;
    QPushButton *sharpenButton;
    QLabel *label;
    QSlider *contrastSlider;
    QWidget *Enhancement;
    QVBoxLayout *verticalLayout_3;
    QPushButton *sobelButton;
    QPushButton *laplacianButton;
    QPushButton *roiButton;
    QPushButton *edgeEnhancementButton;
    QPushButton *thresholdButton;
    QPushButton *morphologyButton;
    QPushButton *blobButton;
    QWidget *Registration;
    QVBoxLayout *verticalLayout_4;
    QPushButton *loadReferenceButton;
    QPushButton *loadTargetButton;
    QPushButton *registerButton;
    QPushButton *showOverlayButton;
    QLabel *shiftXLabel;
    QLabel *shiftYLabel;
    QLabel *rotationLabel;
    QWidget *Reconstruction;
    QVBoxLayout *verticalLayout_5;
    QPushButton *loadPhantomButton;
    QPushButton *generateSignogramButton;
    QPushButton *backProjectionButton;
    QPushButton *filteredBackProjectionButton;
    QWidget *imageCompareWidget;
    QHBoxLayout *horizontalLayout_3;
    QLabel *originalLabel;
    QLabel *resultLabel;
    QPlainTextEdit *logTextEdit;
    QMenuBar *menubar;
    QStatusBar *statusbar;

    void setupUi(QMainWindow *MainWindow)
    {
        if (MainWindow->objectName().isEmpty())
            MainWindow->setObjectName("MainWindow");
        MainWindow->resize(800, 600);
        centralwidget = new QWidget(MainWindow);
        centralwidget->setObjectName("centralwidget");
        verticalLayout = new QVBoxLayout(centralwidget);
        verticalLayout->setObjectName("verticalLayout");
        topBarWidget = new QWidget(centralwidget);
        topBarWidget->setObjectName("topBarWidget");
        horizontalLayout = new QHBoxLayout(topBarWidget);
        horizontalLayout->setObjectName("horizontalLayout");
        openButton = new QPushButton(topBarWidget);
        openButton->setObjectName("openButton");

        horizontalLayout->addWidget(openButton);

        saveButton = new QPushButton(topBarWidget);
        saveButton->setObjectName("saveButton");

        horizontalLayout->addWidget(saveButton);

        resetButton = new QPushButton(topBarWidget);
        resetButton->setObjectName("resetButton");

        horizontalLayout->addWidget(resetButton);

        widget = new QWidget(topBarWidget);
        widget->setObjectName("widget");

        horizontalLayout->addWidget(widget);

        statusLabel = new QLabel(topBarWidget);
        statusLabel->setObjectName("statusLabel");

        horizontalLayout->addWidget(statusLabel);


        verticalLayout->addWidget(topBarWidget);

        centerWidget = new QWidget(centralwidget);
        centerWidget->setObjectName("centerWidget");
        horizontalLayout_2 = new QHBoxLayout(centerWidget);
        horizontalLayout_2->setObjectName("horizontalLayout_2");
        mainTabWidget = new QTabWidget(centerWidget);
        mainTabWidget->setObjectName("mainTabWidget");
        QSizePolicy sizePolicy(QSizePolicy::Policy::Expanding, QSizePolicy::Policy::Expanding);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(mainTabWidget->sizePolicy().hasHeightForWidth());
        mainTabWidget->setSizePolicy(sizePolicy);
        mainTabWidget->setTabPosition(QTabWidget::TabPosition::West);
        mainTabWidget->setTabShape(QTabWidget::TabShape::Rounded);
        Preprocessing = new QWidget();
        Preprocessing->setObjectName("Preprocessing");
        verticalLayout_2 = new QVBoxLayout(Preprocessing);
        verticalLayout_2->setObjectName("verticalLayout_2");
        grayscaleButton = new QPushButton(Preprocessing);
        grayscaleButton->setObjectName("grayscaleButton");

        verticalLayout_2->addWidget(grayscaleButton);

        gaussianBlurButton = new QPushButton(Preprocessing);
        gaussianBlurButton->setObjectName("gaussianBlurButton");

        verticalLayout_2->addWidget(gaussianBlurButton);

        medianFilterButton = new QPushButton(Preprocessing);
        medianFilterButton->setObjectName("medianFilterButton");

        verticalLayout_2->addWidget(medianFilterButton);

        histEqButton = new QPushButton(Preprocessing);
        histEqButton->setObjectName("histEqButton");

        verticalLayout_2->addWidget(histEqButton);

        sharpenButton = new QPushButton(Preprocessing);
        sharpenButton->setObjectName("sharpenButton");

        verticalLayout_2->addWidget(sharpenButton);

        label = new QLabel(Preprocessing);
        label->setObjectName("label");

        verticalLayout_2->addWidget(label);

        contrastSlider = new QSlider(Preprocessing);
        contrastSlider->setObjectName("contrastSlider");
        contrastSlider->setOrientation(Qt::Orientation::Horizontal);

        verticalLayout_2->addWidget(contrastSlider);

        mainTabWidget->addTab(Preprocessing, QString());
        Enhancement = new QWidget();
        Enhancement->setObjectName("Enhancement");
        verticalLayout_3 = new QVBoxLayout(Enhancement);
        verticalLayout_3->setObjectName("verticalLayout_3");
        sobelButton = new QPushButton(Enhancement);
        sobelButton->setObjectName("sobelButton");

        verticalLayout_3->addWidget(sobelButton);

        laplacianButton = new QPushButton(Enhancement);
        laplacianButton->setObjectName("laplacianButton");

        verticalLayout_3->addWidget(laplacianButton);

        roiButton = new QPushButton(Enhancement);
        roiButton->setObjectName("roiButton");

        verticalLayout_3->addWidget(roiButton);

        edgeEnhancementButton = new QPushButton(Enhancement);
        edgeEnhancementButton->setObjectName("edgeEnhancementButton");

        verticalLayout_3->addWidget(edgeEnhancementButton);

        thresholdButton = new QPushButton(Enhancement);
        thresholdButton->setObjectName("thresholdButton");

        verticalLayout_3->addWidget(thresholdButton);

        morphologyButton = new QPushButton(Enhancement);
        morphologyButton->setObjectName("morphologyButton");

        verticalLayout_3->addWidget(morphologyButton);

        blobButton = new QPushButton(Enhancement);
        blobButton->setObjectName("blobButton");

        verticalLayout_3->addWidget(blobButton);

        mainTabWidget->addTab(Enhancement, QString());
        Registration = new QWidget();
        Registration->setObjectName("Registration");
        verticalLayout_4 = new QVBoxLayout(Registration);
        verticalLayout_4->setObjectName("verticalLayout_4");
        loadReferenceButton = new QPushButton(Registration);
        loadReferenceButton->setObjectName("loadReferenceButton");

        verticalLayout_4->addWidget(loadReferenceButton);

        loadTargetButton = new QPushButton(Registration);
        loadTargetButton->setObjectName("loadTargetButton");

        verticalLayout_4->addWidget(loadTargetButton);

        registerButton = new QPushButton(Registration);
        registerButton->setObjectName("registerButton");

        verticalLayout_4->addWidget(registerButton);

        showOverlayButton = new QPushButton(Registration);
        showOverlayButton->setObjectName("showOverlayButton");

        verticalLayout_4->addWidget(showOverlayButton);

        shiftXLabel = new QLabel(Registration);
        shiftXLabel->setObjectName("shiftXLabel");

        verticalLayout_4->addWidget(shiftXLabel);

        shiftYLabel = new QLabel(Registration);
        shiftYLabel->setObjectName("shiftYLabel");

        verticalLayout_4->addWidget(shiftYLabel);

        rotationLabel = new QLabel(Registration);
        rotationLabel->setObjectName("rotationLabel");

        verticalLayout_4->addWidget(rotationLabel);

        mainTabWidget->addTab(Registration, QString());
        Reconstruction = new QWidget();
        Reconstruction->setObjectName("Reconstruction");
        verticalLayout_5 = new QVBoxLayout(Reconstruction);
        verticalLayout_5->setObjectName("verticalLayout_5");
        loadPhantomButton = new QPushButton(Reconstruction);
        loadPhantomButton->setObjectName("loadPhantomButton");

        verticalLayout_5->addWidget(loadPhantomButton);

        generateSignogramButton = new QPushButton(Reconstruction);
        generateSignogramButton->setObjectName("generateSignogramButton");

        verticalLayout_5->addWidget(generateSignogramButton);

        backProjectionButton = new QPushButton(Reconstruction);
        backProjectionButton->setObjectName("backProjectionButton");

        verticalLayout_5->addWidget(backProjectionButton);

        filteredBackProjectionButton = new QPushButton(Reconstruction);
        filteredBackProjectionButton->setObjectName("filteredBackProjectionButton");

        verticalLayout_5->addWidget(filteredBackProjectionButton);

        mainTabWidget->addTab(Reconstruction, QString());

        horizontalLayout_2->addWidget(mainTabWidget);

        imageCompareWidget = new QWidget(centerWidget);
        imageCompareWidget->setObjectName("imageCompareWidget");
        horizontalLayout_3 = new QHBoxLayout(imageCompareWidget);
        horizontalLayout_3->setObjectName("horizontalLayout_3");
        originalLabel = new QLabel(imageCompareWidget);
        originalLabel->setObjectName("originalLabel");
        originalLabel->setMinimumSize(QSize(300, 300));
        originalLabel->setFrameShape(QFrame::Shape::Box);
        originalLabel->setScaledContents(true);
        originalLabel->setAlignment(Qt::AlignmentFlag::AlignCenter);

        horizontalLayout_3->addWidget(originalLabel);

        resultLabel = new QLabel(imageCompareWidget);
        resultLabel->setObjectName("resultLabel");
        resultLabel->setMinimumSize(QSize(300, 300));
        resultLabel->setFrameShape(QFrame::Shape::Box);
        resultLabel->setScaledContents(true);
        resultLabel->setAlignment(Qt::AlignmentFlag::AlignCenter);

        horizontalLayout_3->addWidget(resultLabel);


        horizontalLayout_2->addWidget(imageCompareWidget);


        verticalLayout->addWidget(centerWidget);

        logTextEdit = new QPlainTextEdit(centralwidget);
        logTextEdit->setObjectName("logTextEdit");
        logTextEdit->setReadOnly(true);

        verticalLayout->addWidget(logTextEdit);

        MainWindow->setCentralWidget(centralwidget);
        menubar = new QMenuBar(MainWindow);
        menubar->setObjectName("menubar");
        menubar->setGeometry(QRect(0, 0, 800, 33));
        MainWindow->setMenuBar(menubar);
        statusbar = new QStatusBar(MainWindow);
        statusbar->setObjectName("statusbar");
        MainWindow->setStatusBar(statusbar);

        retranslateUi(MainWindow);

        mainTabWidget->setCurrentIndex(0);


        QMetaObject::connectSlotsByName(MainWindow);
    } // setupUi

    void retranslateUi(QMainWindow *MainWindow)
    {
        MainWindow->setWindowTitle(QCoreApplication::translate("MainWindow", "MainWindow", nullptr));
        openButton->setText(QCoreApplication::translate("MainWindow", "Open", nullptr));
        saveButton->setText(QCoreApplication::translate("MainWindow", "Save", nullptr));
        resetButton->setText(QCoreApplication::translate("MainWindow", "Reset", nullptr));
        statusLabel->setText(QCoreApplication::translate("MainWindow", "Status: Ready", nullptr));
        grayscaleButton->setText(QCoreApplication::translate("MainWindow", "Grayscale", nullptr));
        gaussianBlurButton->setText(QCoreApplication::translate("MainWindow", "Gaussian Blur", nullptr));
        medianFilterButton->setText(QCoreApplication::translate("MainWindow", "Median Filter", nullptr));
        histEqButton->setText(QCoreApplication::translate("MainWindow", "Histogram Equalization", nullptr));
        sharpenButton->setText(QCoreApplication::translate("MainWindow", "Sharpening", nullptr));
        label->setText(QCoreApplication::translate("MainWindow", "Contrast", nullptr));
        mainTabWidget->setTabText(mainTabWidget->indexOf(Preprocessing), QCoreApplication::translate("MainWindow", "Preprocessing", nullptr));
        sobelButton->setText(QCoreApplication::translate("MainWindow", "Sobel", nullptr));
        laplacianButton->setText(QCoreApplication::translate("MainWindow", "Laplacian", nullptr));
        roiButton->setText(QCoreApplication::translate("MainWindow", "ROI Analysis", nullptr));
        edgeEnhancementButton->setText(QCoreApplication::translate("MainWindow", "Edge Enhancement", nullptr));
        thresholdButton->setText(QCoreApplication::translate("MainWindow", "Threshold", nullptr));
        morphologyButton->setText(QCoreApplication::translate("MainWindow", "Morphology", nullptr));
        blobButton->setText(QCoreApplication::translate("MainWindow", "Blob Candidate", nullptr));
        mainTabWidget->setTabText(mainTabWidget->indexOf(Enhancement), QCoreApplication::translate("MainWindow", "Enhancement", nullptr));
        loadReferenceButton->setText(QCoreApplication::translate("MainWindow", "Load Reference", nullptr));
        loadTargetButton->setText(QCoreApplication::translate("MainWindow", "Load Target", nullptr));
        registerButton->setText(QCoreApplication::translate("MainWindow", "Register", nullptr));
        showOverlayButton->setText(QCoreApplication::translate("MainWindow", "Show Overlay", nullptr));
        shiftXLabel->setText(QCoreApplication::translate("MainWindow", "Shift X : 0", nullptr));
        shiftYLabel->setText(QCoreApplication::translate("MainWindow", "Shift Y : 0", nullptr));
        rotationLabel->setText(QCoreApplication::translate("MainWindow", "Rotation : 0", nullptr));
        mainTabWidget->setTabText(mainTabWidget->indexOf(Registration), QCoreApplication::translate("MainWindow", "Registration", nullptr));
        loadPhantomButton->setText(QCoreApplication::translate("MainWindow", "Load Phantom", nullptr));
        generateSignogramButton->setText(QCoreApplication::translate("MainWindow", "Generate Sinogram", nullptr));
        backProjectionButton->setText(QCoreApplication::translate("MainWindow", "Back Projection", nullptr));
        filteredBackProjectionButton->setText(QCoreApplication::translate("MainWindow", "Filtered Back Projection", nullptr));
        mainTabWidget->setTabText(mainTabWidget->indexOf(Reconstruction), QCoreApplication::translate("MainWindow", "Reconstruction", nullptr));
        originalLabel->setText(QCoreApplication::translate("MainWindow", "Original Image", nullptr));
        resultLabel->setText(QCoreApplication::translate("MainWindow", "Result Image", nullptr));
        logTextEdit->setPlainText(QCoreApplication::translate("MainWindow", "Log / Processing info", nullptr));
    } // retranslateUi

};

namespace Ui {
    class MainWindow: public Ui_MainWindow {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_MAINWINDOW_H
