import React, { Component } from 'react';
import { Doughnut } from 'react-chartjs-2';

const data = {
    labels: [
        'Covered 86%',
        'Uncovered 14%'
    ],
    datasets: [{
        data: [86, 100-86],
        backgroundColor: [
            '#a4ffa1',
            '#bebebe'
        ],
        hoverBackgroundColor: [
            '#8bdc88',
            '#a0a0a0'/*,
            '#FFCE56'*/
        ]
    }]
};

class DashboardItem extends Component {


    render() {
        return (
            <div className="card d-inline-block">
                <div className="card-header h7">
                    Code Coverage
                </div>
                <div className="card-body">
                    <Doughnut data={data}/>
                </div>
            </div>
        )

        // const LineChart = require("react-chartjs-2").Line;
    }
}

export default DashboardItem;
