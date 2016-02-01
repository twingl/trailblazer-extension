import React from 'react';

export default class ImageButton extends React.Component {
  render() {
    return  <a
              className={this.props.className}
              title={this.props.title}
              onClick={this.props.onClick.bind(this)}
              href="#" >
              <img src={this.props.img} ></img>
            </a>;
  }
};
