import React from 'react';

export default class Layout extends React.Component {

  render() {
    return <div className='wrap'>
      {this.props.children}
    </div>;
  }

};
