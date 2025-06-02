import express from 'express';
import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import moment from 'moment';

const router = express.Router();

// Initialize ChartJS canvas
const width = 600;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

// Helper function to create emotion distribution chart
async function createEmotionChart(emotionData) {
    const emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'];
    const counts = emotions.map(emotion => 
        emotionData.filter(data => data.dominantEmotion === emotion).length
    );
    
    const configuration = {
        type: 'pie',
        data: {
            labels: emotions.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
            datasets: [{
                data: counts,
                backgroundColor: [
                    '#00ff00', // happy
                    '#00a8ff', // sad
                    '#ff0033', // angry
                    '#cc00ff', // fearful
                    '#ff6600', // disgusted
                    '#ffff00', // surprised
                    '#ffffff'  // neutral
                ]
            }]
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Emotion Distribution',
                    font: { size: 16 }
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

// Helper function to create emotion timeline chart
async function createTimelineChart(emotionData) {
    const timePoints = emotionData.map(data => data.timestamp);
    const emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'];
    
    const datasets = emotions.map(emotion => ({
        label: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        data: emotionData.map(data => data.expressions[emotion] * 100),
        borderColor: {
            happy: '#00ff00',
            sad: '#00a8ff',
            angry: '#ff0033',
            fearful: '#cc00ff',
            disgusted: '#ff6600',
            surprised: '#ffff00',
            neutral: '#ffffff'
        }[emotion],
        fill: false
    }));

    const configuration = {
        type: 'line',
        data: {
            labels: timePoints.map(t => moment.duration(t, 'seconds').format('mm:ss')),
            datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: 'Emotion Timeline',
                    font: { size: 16 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Confidence (%)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    };

    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

// Generate key insights from emotion data
function generateInsights(emotionData) {
    const insights = [];
    
    // Most common emotion
    const emotionCounts = {};
    emotionData.forEach(data => {
        emotionCounts[data.dominantEmotion] = (emotionCounts[data.dominantEmotion] || 0) + 1;
    });
    const mostCommon = Object.entries(emotionCounts)
        .reduce((a, b) => (a[1] > b[1] ? a : b));
    insights.push(`Most common emotion: ${mostCommon[0]} (${Math.round(mostCommon[1] / emotionData.length * 100)}% of time)`);

    // Emotional transitions
    let transitions = 0;
    for (let i = 1; i < emotionData.length; i++) {
        if (emotionData[i].dominantEmotion !== emotionData[i-1].dominantEmotion) {
            transitions++;
        }
    }
    insights.push(`Number of emotional transitions: ${transitions}`);

    // Peak emotional moments
    const peakHappy = emotionData.reduce((max, data) => 
        data.expressions.happy > max.expressions.happy ? data : max
    );
    insights.push(`Peak happiness moment: ${moment.duration(peakHappy.timestamp, 'seconds').format('mm:ss')} (${Math.round(peakHappy.expressions.happy * 100)}% confidence)`);

    return insights;
}

// Route to generate and download PDF report
router.post('/generate', async (req, res) => {
    try {
        const { emotionData, videoTitle = 'Untitled Video' } = req.body;

        if (!emotionData || !Array.isArray(emotionData) || emotionData.length === 0) {
            return res.status(400).json({ error: 'Invalid or empty emotion data' });
        }

        // Create PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=emotion-analysis-${Date.now()}.pdf`);
        
        // Pipe PDF to response
        doc.pipe(res);

        // Add title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('Emotion Analysis Report', { align: 'center' })
           .moveDown();

        // Add video details
        doc.fontSize(14)
           .font('Helvetica')
           .text(`Video: ${videoTitle}`)
           .text(`Analysis Date: ${moment().format('MMMM D, YYYY')}`)
           .text(`Duration: ${moment.duration(emotionData[emotionData.length - 1].timestamp, 'seconds').format('mm:ss')}`)
           .moveDown();

        // Add emotion distribution chart
        const distributionChart = await createEmotionChart(emotionData);
        doc.image(distributionChart, {
            fit: [500, 300],
            align: 'center'
        })
        .moveDown();

        // Add timeline chart
        const timelineChart = await createTimelineChart(emotionData);
        doc.addPage()
           .image(timelineChart, {
               fit: [500, 300],
               align: 'center'
           })
           .moveDown();

        // Add insights
        doc.addPage()
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('Key Insights', { underline: true })
           .moveDown();

        const insights = generateInsights(emotionData);
        insights.forEach(insight => {
            doc.fontSize(12)
               .font('Helvetica')
               .text(insight)
               .moveDown(0.5);
        });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF report' });
    }
});

export default router; 