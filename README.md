**Repository name change! If you have a copy of the extension that points to `github.com/twingl/trailblazer-wash` you will want to update that to the new one**

# Trailblazer Extension

Trailblazer is a Chrome extension built to track a user's browsing activity and
build up a map, helping them make sense of the places they visit.

## Prerequisites

### Node

If you have a modern version of node, excellent - you're good to go. This has
been tested on 5.x so far so if you run into problems create an issue and we
can address it.

### EditorConfig 

You also should have the [EditorConfig plugin](http://editorconfig.org/)
installed for your editor before editing any of the source.

## Setup

See the [Getting Started](https://github.com/twingl/trailblazer-wash/wiki/Getting-Started) guide

## API

Documentation for the API that backs the extension can be found here:

- [Authentication](http://docs.trailblazerauthentication.apiary.io/)
- [Resource API](http://docs.trailblazerapiv1.apiary.io/)

## Domain Concepts

### Map / Trail

This is what the user sees when they view an assignment using Trailblazer's UI,
i.e. it's the sum of an Assignment and all of its Nodes rendered in the graph
layout.

### Assignment

This is the container to which browsing activity (Nodes) is attached.

As far as vernacular is concerned, it should be noted here that Assignment and
Map essentially refer to the same construct, but from different contexts (and
subsequently different boundaries regarding what they encompass).

When referring to it as an Assignment, this is usually from a context where the
data model is being considered in some detail (e.g. interacting with the API).
In these kinds of contexts it is often important to make the distinction
between the Map as a whole (which encompasses the Assignment, its Nodes and
often the User), and the Assignment component which acts as a container object
for Nodes and a join model between a Project and a User. In the case where it
is being referred to as a Map, it's less important to consider the intricacies
of the data model, considering it as a 'sum of its parts' - often in the
context of design and UI/UX.

### Node

This is the 'smallest' item in the data model, encompassing a visit to some web
address in the context of an Assignment. It houses information about the site,
as well as meta-data such as when the address was first visited. In future it
may also house information such as return visits and time spent viewing/idle.

## Workflow

Git, GitHub workflow for this Chrome Extension

1. Pull from GitHub so the local copy of `master` is up to date.
2. Start a feature branch, named appropriate to the story (e.g. the story may
   be called "Assignment list", so the branch is named `assignment-list`).
3. \[Do work things\].
4. When the feature is finished and is ready to go for code review, **prefix the
   branch with "[needs review]", open a new Pull Request**.
5. Someone else reviews the changes and either **closes the PR, merges the
   branch**, or gives **feedback to action before it can be
   closed/merged/delivered**.
