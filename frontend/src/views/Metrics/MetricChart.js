import React, {Component} from 'react';
import {Line} from "react-chartjs-2";
import {Range} from 'rc-slider';
import 'rc-slider/assets/index.css';

class MetricChart extends Component {

    constructor(props) {
        super(props);
        this.name = props.name;
        this.data = {
            yValues: props.yValues,
            xValues: props.xValues
        };
        this.state = {
            chartData: {
                labels: props.xValues,
                datasets: [
                    {
                        label: props.name,
                        fill: true,
                        lineTension: 0.1,
                        backgroundColor: 'rgba(75,192,192,0.4)',
                        borderColor: 'rgba(75,192,192,1)',
                        borderCapStyle: 'butt',
                        borderDash: [],
                        borderDashOffset: 0.0,
                        borderJoinStyle: 'miter',
                        pointBorderColor: 'rgba(75,192,192,1)',
                        pointBackgroundColor: '#fff',
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: 'rgba(75,192,192,1)',
                        pointHoverBorderColor: 'rgba(220,220,220,1)',
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        data: props.yValues,
                    }
                ]
            },
        };
    }

    onSliderChange(range) {
        let newState = {
            chartData: Object.assign({}, this.state.chartData)
        };
        newState.chartData.labels = this.data.xValues.slice(range[0], range[1]);
        newState.chartData.datasets[0].data = this.data.yValues.slice(range[0], range[1]);
        this.setState(newState);
    }

    render() {
        return (
            <div>
                <Line data={this.state.chartData}/>
                <div style={{margin: 50}}>
                    <p>Range filter</p>
                    <Range defaultValue={[0, this.data.xValues.length]} min={0} max={this.data.xValues.length}
                           onChange={this.onSliderChange.bind(this)}/>
                </div>

            </div>

        );
    }
}

export default MetricChart;