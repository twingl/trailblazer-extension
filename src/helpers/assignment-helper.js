var AssignmentHelper = {
  getAPIData: function (assignment) {
    var data = {
      assignment: {
        title: assignment.title,
      }
    };

    if (assignment.description) data.assignment.description = assignment.description;
    if (assignment.visible === true || assignment.visible === false) data.assignment.visible = assignment.visible;

    return data;
  }
};

module.exports = AssignmentHelper;
