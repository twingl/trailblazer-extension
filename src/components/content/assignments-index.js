var _     = require('lodash')
  , React = require('react');

import constants from '../../constants';
import queries from '../../queries';

var articles = {
  "http://en.wikipedia.org/wiki/Anthropodermic_bibliopegy": "Anthropodermic bibliopegy",
  "http://en.wikipedia.org/wiki/Elm_Farm_Ollie": "Elm Farm Ollie",
  "http://en.wikipedia.org/wiki/EURion_constellation": "EURion constellation",
  "http://en.wikipedia.org/wiki/Demon_core": "(the) Demon core",
  "http://en.wikipedia.org/wiki/Pole_of_inaccessibility": "Pole of inaccessibility",
  "http://en.wikipedia.org/wiki/Globster": "Globster",
  "http://en.wikipedia.org/wiki/Hoba_meteorite": "Hoba meteorite",
  "http://en.wikipedia.org/wiki/Seattle_Windshield_Pitting_Epidemic": "Seattle Windshield Pitting Epidemic",
  "http://en.wikipedia.org/wiki/GRB_971214": "GRB 971214",
  "http://en.wikipedia.org/wiki/Resolute_desk": "\"Resolute\" desk",
  "http://en.wikipedia.org/wiki/Candace_Newmaker": "Candace Newmaker",
  "http://en.wikipedia.org/wiki/Cryptomnesia": "Cryptomnesia",
  "http://en.wikipedia.org/wiki/Hans_Island": "Hans Island",
  "http://en.wikipedia.org/wiki/Harrowing_of_Hell": "Harrowing of Hell",
  "http://en.wikipedia.org/wiki/Semantic_satiation": "Semantic satiation",
  "http://en.wikipedia.org/wiki/Dempster_Highway": "Dempster Highway",
  "http://en.wikipedia.org/wiki/Dalton_Highway": "Dalton Highway",
  "http://en.wikipedia.org/wiki/Paul_Armand_Delille": "Paul Felix Armand-Delille",
  "http://en.wikipedia.org/wiki/Herschel_Island": "Herschel Island",
  "http://en.wikipedia.org/wiki/Stone_spheres_of_Costa_Rica": "Stone spheres of Costa Rica",
  "http://en.wikipedia.org/wiki/Paternoster": "Paternoster",
  "http://en.wikipedia.org/wiki/Self-immolation": "Self-immolation",
  "http://en.wikipedia.org/wiki/Narco_submarine": "Narco submarine",
  "http://en.wikipedia.org/wiki/Louis_Slotin": "Louis Slotin",
  "http://en.wikipedia.org/wiki/Language_deprivation_experiments": "Language deprivation experiments",
  "http://en.wikipedia.org/wiki/London_Stone": "London Stone",
  "http://en.wikipedia.org/wiki/Cit%C3%A9_Soleil": "Cité Soleil",
  "http://en.wikipedia.org/wiki/Blood_chit": "Blood chit",
  "http://en.wikipedia.org/wiki/Parsley_Massacre": "Parsley Massacre",
  "http://en.wikipedia.org/wiki/Ribbon_Creek_Incident": "Ribbon Creek Incident",
  "http://en.wikipedia.org/wiki/Art_intervention": "Art intervention",
  "http://en.wikipedia.org/wiki/Impostor": "Impostor",
  "http://en.wikipedia.org/wiki/Bata_LoBagola": "Bata LoBagola",
  "http://en.wikipedia.org/wiki/Cheating_at_the_Paralympic_Games": "Cheating at the Paralympic Games",
  "http://en.wikipedia.org/wiki/David_Hempleman-Adams": "David Hempleman-Adams",
  "http://en.wikipedia.org/wiki/The_Kafka_Machine": "The Kafka Machine",
  "http://en.wikipedia.org/wiki/Park_Young_Seok": "Park Young Seok",
  "http://en.wikipedia.org/wiki/Houston_Riot_(1917)": "Houston Riot (1917)",
  "http://en.wikipedia.org/wiki/Henry_Pierrepoint": "Albert Pierrepoint",
  "http://en.wikipedia.org/wiki/Discoveries_of_human_feet_on_British_Columbia_beaches,_2007%E2%80%932008": "Discoveries of human feet on British Columbia beaches, 2007–2008",
  "http://en.wikipedia.org/wiki/Taman_Shud_Case": "Taman Shud Case",
  "http://en.wikipedia.org/wiki/Who_put_Bella_in_the_Wych_Elm%3F": "Who put Bella in the Wych Elm?",
  "http://en.wikipedia.org/wiki/First_flying_machine": "First flying machine",
  "http://en.wikipedia.org/wiki/Defeat_in_detail": "Defeat in Detail",
  "http://en.wikipedia.org/wiki/Peppered_moth_evolution": "Peppered moth evolution",
  "http://en.wikipedia.org/wiki/Resource_holding_potential": "Resource holding potential",
  "http://en.wikipedia.org/wiki/Dismas": "Saint Dismas",
  "http://en.wikipedia.org/wiki/Target_girl": "Target girl",
  "http://en.wikipedia.org/wiki/Longevity_myths": "Longevity myths",
  "http://en.wikipedia.org/wiki/SL-1": "SL-1"
}

var AssignmentItem = require('../assignment-item');

module.exports = React.createClass({

  getInitialState: function () {
    return { assignments: [] };
  },

  componentDidMount: function () {
    queries.AssignmentStore.getAssignments().then( (assignments) => {
      this.setState({ assignments });
    });

    chrome.runtime.onMessage.addListener( (message) => {
      if (message.action === constants.__change__ && message.storeName === "AssignmentStore") {
        queries.AssignmentStore.getAssignments().then( (assignments) => {
          this.setState({ assignments });
        });
      }
    });

    this.props.actions.requestAssignments();
    this.props.actions.viewedAssignmentList();
  },

  startMeandering: function (evt) {
    evt.preventDefault();

    var url = evt.currentTarget.href;

    chrome.tabs.create({ url: url, active: true }, function(tab) {
      this.props.actions.startRecording(tab.id, tab);
    }.bind(this));
  },

  render: function () {
    document.title = "Resume a Trail";

    var list = [];
    _.each(this.state.assignments, function (item) {
      list.push(React.createElement(AssignmentItem, {item: item, key: item.localId, actions: this.props.actions}))
    }.bind(this));

    if (list.length > 0) {
      return <div className="wrap assignment-index">
        <h1>Your Trails</h1>
        <ul className="assignment-menu">{list}</ul>
      </div>;
    } else {
      var link, title;

      link = _.sample(Object.keys(articles));
      title = articles[link];

      return <div className="wrap assignment-index">
        <h1>Your Trails</h1>
        <p>
          Oops, there's nothing here yet.
        </p>
        <p>
          Perhaps you might like to start by checking out <strong><a onClick={this.startMeandering} className="primary" href={link}>{title}</a></strong> on Wikipedia?<br />
          We found it on a list of 50 interesting Wiki articles <a onClick={this.startMeandering} className="primary" href="http://hollybrockwell.com/2009/09/29/50-more-of-wikipedias-most-interesting-articles/"> here</a> (thanks Holly and Ray)
        </p>
        <p>
          The links above will start you on a new trail, so you can get straight into exploring!
        </p>
      </div>;
    }
  }

});
