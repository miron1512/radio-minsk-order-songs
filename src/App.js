import React, { Component } from 'react';
import {
  FieldGroup,
  FormGroup,
  ControlLabel,
  FormControl,
  Button,
  ListGroupItem
} from 'react-bootstrap';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      captcha: null,

      Name: '',
      SongName: '',
      Text: '',
      CaptchaInputText: '',
      captchaCode: '',

      statusCode: null
    }
    this.fetchCaptcha();
  }

  fetchCaptcha() {
    let myHeaders = new Headers();
    if (this.cook1 && this.cook2) {
      myHeaders.append('cook1', this.cook1);
      myHeaders.append('cook2', this.cook2);
      myHeaders.append('captchacode', this.state.captchaCode);
    }
    let options = {
      method: 'GET',
      headers: myHeaders,
    };


    fetch('http://localhost:8080/api/GetCaptcha', options)
      .then(response => {
        console.log('response', response);
        this.setState({
          captchaCode: response.headers.get('captchaCode').toString()
        });
        this.cook1 = response.headers.get('cook1').toString();
        this.cook2 = response.headers.get('cook2').toString();
        return response.blob();
      })
      .then((blob) => {
        console.log('blob', blob);
        let img = new Image();
        img.src = window.URL.createObjectURL(blob);
        img.onload = () => {
          console.log('load');
          this.setState({ captcha: img });
        }
      });
  }

  SendMessage() {
    this.setState({ statusCode: null });
    let myHeaders = new Headers();
    let {Name, SongName, Text, CaptchaInputText, captchaCode} = this.state;
    if (this.cook1 && this.cook2) {
      myHeaders.append('cook1', this.cook1);
      myHeaders.append('cook2', this.cook2);
      myHeaders.append('captchacode', this.captchaCode);
      myHeaders.append('query', `Name=${Name}&SongName=${SongName}&Text=${Text}&CaptchaDeText=${captchaCode}&CaptchaInputText=${CaptchaInputText}`);
    }
    let options = {
      method: 'GET',
      headers: myHeaders,
    };

    fetch('http://localhost:8080/api/SendMessage', options)
      .then(response => {
        console.log('response statusCode', response.status);
        this.setState({ statusCode: response.status });
      });

  }

  render() {
    let {
      Name,
      SongName,
      Text,
      captcha,
      CaptchaInputText,
      statusCode,
    } = this.state;
    return (
      <div className="App">
        <div className="App-header">
          <h2>Radio Minsk Order Songs</h2>
        </div>

        <div className="SendForm">
          <FormGroup>
            <ControlLabel>Name</ControlLabel>
            <FormControl
              type="text"
              value={Name}
              onChange={(e) => this.setState({ Name: e.target.value })}
              placeholder="Enter Name" />
          </FormGroup>

          <FormGroup>
            <ControlLabel>SongName</ControlLabel>
            <FormControl
              type="text"
              value={SongName}
              onChange={(e) => this.setState({ SongName: e.target.value })}
              placeholder="Enter SongName" />
          </FormGroup>

          <FormGroup>
            <ControlLabel>Textarea</ControlLabel>
            <FormControl
              componentClass="textarea"
              value={Text}
              onChange={(e) => this.setState({ Text: e.target.value })}
              placeholder="Text of message" />
          </FormGroup>

          {
            captcha
              ? (<div>
                <img src={captcha.src} />
                <div
                  className="btn btn-info"
                  onClick={() => this.fetchCaptcha()}
                  >Refresh Captcha
                </div>
              </div>)
              : ""
          }

          <FormGroup>
            <ControlLabel>CaptchaInputText</ControlLabel>
            <FormControl
              type="text"
              value={CaptchaInputText}
              onChange={(e) => this.setState({ CaptchaInputText: e.target.value })}
              placeholder="Enter Captcha" />
          </FormGroup>

          <Button type="submit" onClick={() => this.SendMessage()}>
            Submit
        </Button>
          {
            statusCode
              ? <ListGroupItem bsStyle={statusCode == 200 ? "success" : "danger"}>Message {statusCode == 200 ? "" : "not "}sent</ListGroupItem>
              : ''
          }
        </div>
      </div>
    );
  }
}

export default App;
