import React, {Component} from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    
    this.onFileSelectHandler = this.onFileSelectHandler.bind(this);
    this.onFileUploadHandler = this.onFileUploadHandler.bind(this);
    this.onGetResultsHandler = this.onGetResultsHandler.bind(this);
    this.onUseMockData = this.onUseMockData.bind(this);
    this.onCalculateDateRanges = this.onCalculateDateRanges.bind(this);

    this.state = {
      auth: {
        clientId: 'YOUR-CLIENT-ID',
        clientSecret: 'YOUR-CLIENT-SECRET'
      },
      contacts: [],
      accessToken: '',
      selectedFile: null,
      fileId: 0,
      results: [],
      groupedResults: [],
      dateRanges: [],
      error: null
    }
  }

  componentDidMount() {

    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Accept', 'application/json');
    headers.append('Access-Control-Allow-Origin', 'http://localhost:3000/');
    headers.append('Access-Control-Allow-Credentials', 'true');
    headers.append('GET', 'POST', 'OPTIONS');

    fetch('https://login.sypht.com/oauth/token', {
      method: 'post',
      mode: 'no-cors',
      credentials: 'include',
      headers: headers,
      body: JSON.stringify({
         client_id: this.state.auth.clientId,
         client_secret: this.state.auth.clientSecret,
         audience: "https://api.sypht.com",
         grant_type: "client_credentials"
      })
    })
    .then(res => res.json())
    .then((data) => {
      this.setState({ accessToken: data.access_token })
    })
    .catch(() => {
      this.setState({ 
        error: 'OAuth failed'
      })
    })
  }

  onUseMockData() {
    this.setState({
      results: [
        {
          "name": "bpayBillerCode",
          "value": "7773",
          "confidence": 1
        },
        {
          "name": "dueDate",
          "value": "2018-01-17",
          "confidence": 1
        },
        {
          "name": "bpayCRN",
          "value": "2376513400",
          "confidence": 1
        },
        {
          "name": "bpayCRN",
          "value": "12376513400",
          "confidence": 3
        },
        {
          "name": "bpayCRN",
          "value": "22376513400",
          "confidence": 4
        },
        {
          "name": "amountDueAfterDiscount",
          "value": "27.50",
          "confidence": 1
        }
      ]
    }, () => {
      this.setState({ 
        groupedResults: this.groupBy(this.state.results, 'name')
      })
    });
  }

  groupBy(objectArray, property) {
    return objectArray.reduce(function (acc, obj) {
      let key = obj[property];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(obj);
      return acc;
    }, {});
  }

  onFileSelectHandler(event) {
    this.setState({
      selectedFile: event.target.files[0]
    })
  }

  onFileUploadHandler(event) {
    const data = new FormData() 
    data.append('fileToUpload', this.state.selectedFile)

    fetch('https://api.sypht.com/fileupload/', {
      method: 'POST',
      headers: {
        'bearerToken': this.state.accessToke
      },
      body: data
    })
    .then(res => res.json())
    .then((data) => {
      switch (data.code) {
        case 'InvalidCredentials':
          this.setState({ 
            error: data.message
          })
          break;
        default:
          this.setState({ 
            fileId: data.id
          })
          break;
      }
    })
    .catch((response) => {
      this.setState({ 
        error: response.message
      })
    })
  }

  onGetResultsHandler(event) {
    this.setState({ 
      error: null
    })
    fetch('https://api.sypht.com/result/final/' + this.state.fileId, {
      method: 'GET',
      headers: {
        'bearerToken': this.state.accessToke
      }
    })
    .then(res => res.json())
    .then((data) => {
      switch (data.code) {
        case 'InvalidCredentials':
          this.setState({ 
            error: data.message
          })
          break;
        default:
          this.setState({ 
            results: data.fields
          })
          break;
      }
    })
    .catch((response) => {
      this.setState({ 
        error: response.message
      })
    })
  }

  onCalculateDateRanges() {

    // case 1
    this.calculateDateRange('02/06/1983', '22/06/1983', () => {

      // case 2
      this.calculateDateRange('04/07/1984', '25/12/1984', () => {

        // case 3
        this.calculateDateRange('03/01/1989', '03/08/1983');
      });
    });
  }

  calculateDateRange(startParam, endParam, callback) {
    if (startParam && endParam) {
      var start = startParam.split('/');
      var end = endParam.split('/');

      let oneDay = 24*60*60*1000;
      var dateFrom = new Date(+start[2], +start[1], +start[0]);
      var dateTo = new Date(+end[2], +end[1], +end[0]);

      if (dateFrom && dateTo) {
        var duration = Math.round(Math.abs((dateFrom.getTime() - dateTo.getTime())/(oneDay)));

        this.setState({
          dateRanges: [...this.state.dateRanges, { from: startParam, to: endParam, duration: duration - 1 }]
        }, callback)
      }
    }
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <form className="col-md-12 col-lg-4 offset-lg-4">
            <h2>Upload document form</h2>
            <div className="form-group">
              <div className="custom-file">
                <input type="file" className="custom-file-input" onChange={this.onFileSelectHandler} />
                <label className="custom-file-label">Choose file</label>
              </div>
            </div>
            <div className="form-group">
              <button type="button" className="btn btn-secondary" onClick={this.onFileUploadHandler}>Upload</button>
            </div>
            <div className="form-group">
              <div className="btn-group">
                <button type="button" className="btn btn-success" onClick={this.onUseMockData}>Use Mock Data</button>
                <button type="button" className="btn btn-warning" onClick={this.onCalculateDateRanges}>Calculate Date Ranges</button>
              </div>
            </div>
            { this.state.error ? <div className="alert alert-warning">{this.state.error}</div> : null }
            { this.state.fileId ? <div className="form-group">
                <div className="alert alert-info">Your document was successfully uploaded, and now we can gather results</div>
                <button type="button" className="btn btn-secondary" onClick={this.onGetResultsHandler}>Continue</button>
              </div> : null }
          </form>
        </div>
        {
          Object.keys(this.state.groupedResults).map((key)  => 
            <div key={key}>
              <div className="card">
                <div className="card-body">
                  <h5 className="card-title">{key}</h5>
                  {
                    this.state.groupedResults[key].map((field, index) => 
                      <p className="card-text" key={index}>{field.value} (confidence: {field.confidence})</p>
                    )
                  }
                </div>
              </div>
              <br />
            </div>
          )
        }
        {this.state.dateRanges ? 
          this.state.dateRanges.map((dateRange, index) => 
            <div className="card-text" key={index}>{dateRange.from} - {dateRange.to} (duration: {dateRange.duration} days)</div>
          ) : null
        }
      </div>
    );
  }
}

export default App;