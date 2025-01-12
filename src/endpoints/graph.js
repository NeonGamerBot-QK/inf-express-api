// default template 
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
function renderGraph(chart, data) {
return  chart.renderToBuffer(data);
}
module.exports = (router, db) => {
    router.get('/', (req,res) => res.json({ message: "OK" }))
    // router.all('/', (req,res) => res.send('Hello, world!'))
    // body can handle bigger payloads of data then query string
    router.post('/', async (req,res) => {
        res.set('Content-Type', 'image/png')
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: req.query.width || 800, height: req.query.height ||600 });
        res.send(await renderGraph(chartJSNodeCanvas, req.body))
    })
    // so ill make it have a GET & POST
    router.post('/line/simple', async (req,res) => {
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: req.body.width || 800, height: req.body.height ||600 });
        const data = {
            type: 'line',
            data: {
                labels: req.body.labels,
                datasets: [{
                    label: req.body.ylabel || "Y Axis",
                    data: req.body.y,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill under the line
                    borderColor: 'rgba(75, 192, 192, 1)', // Line color
                    borderWidth: 2,
                    tension: 0.4 // Smooth curves
                }],   options: {
                    responsive: false, // Set to false for server-side rendering
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Months'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Sales ($)'
                        }
                      }
                    }
                  }
            }
        }

        res.set('Content-Type', 'image/png')
        renderGraph(chartJSNodeCanvas, data).then(buffer => {
            // console.log(buffer)
            return res.send(buffer)
        })
    })
    router.get('/line/simple', async (req,res) => {
        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: req.query.width || 800, height: req.query.height ||600 });
        const data = {
            type: 'line',
            data: {
                labels: req.query.labels.split(','),
                datasets: [{
                    label: req.body.ylabel || "Y Axis",
                    data: req.query.y.split(','),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill under the line
                    borderColor: 'rgba(75, 192, 192, 1)', // Line color
                    borderWidth: 2,
                    tension: 0.4 // Smooth curves
                }],   options: {
                    responsive: false, // Set to false for server-side rendering
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top'
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Months'
                        }
                      },
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Sales ($)'
                        }
                      }
                    }
                  }
            }
        }

        res.set('Content-Type', 'image/png')
        renderGraph(chartJSNodeCanvas, data).then(buffer => {
            console.log(buffer)
            return res.send(buffer)
        })
    })
}
