# Trailblazer "Wash"

Trailblazer is a Chrome extension built to track a user's browsing activity and
build up a map, helping them make sense of the places they visit.

## Prerequisites

You need to have Node.js or IO.js installed and npm available on the command
line

You need to have Gulp installed globally to build the extension

    $ npm install -g gulp

You also should have the [EditorConfig plugin](http://editorconfig.org/)
installed for your editor before editing any source files.

## Setup

    $ git clone git://github.com/twingl/trailblazer-wash.git

    $ cd trailblazer-wash

    $ npm install

Set up the environment configuration based on the example

    $ cp .env-example .env

    $ vim .env # and insert your API credentials, configuration

## Building for Development

From the root directory

    $ gulp build

will build the application, ready to be loaded into Chrome.

**If you change any dependencies (i.e. install any local npm packages), ensure
you run `npm shrinkwrap --dev` and commit the changes**

## Building for Release

First of all, ensure you have a `.env-production` file with the production
credentials in place. To set this up, contact [Greg](greg@twin.gl)

From the root directory, run the following

    $ gulp release --production

This will do the following:

- Bump the patch version of the extension in the manifest
  - You can perform a `--major` `--minor` or `--patch (default)` bump with the
    appropriate command line switch
- Create a release commit at that version
- Tag the release version against the commit
- Build the extension using production configuration
- Create an archive containing the extension ready to upload to the
  [Chrome Web Store](://chrome.google.com/webstore/developer/dashboard)

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

## Work flow

Git, GitHub, Pivotal work flow for a Chrome Extension

This list of steps assumes that features have been prioritised and assigned a
point value.

1. Tap `Start` on a story in Pivotal.
2. Pull from GitHub so the local copy of `master` is up to date.
3. Start a feature branch, named appropriate to the story (e.g. the story may
   be called "Assignment list", so the branch is named `assignment-list`).
4. \[Do work things\].
5. When the feature is finished and is ready to go for code review, **prefix the
   branch with "[needs review]", open a new Pull Request and tap `Finish` in
   Pivotal**.
6. Someone else reviews the changes and either **closes the PR, merges the
   branch and taps `Deliver`**, or gives **feedback to action before it can be
   closed/merged/delivered**.
7. The product owner then steps in at some point in the future and checks if
   the story in `master` fits the product goals, **tapping `Accept` if so or
   tapping `Reject` if not**.
8. If rejected, the product owner **includes a description of what needs to be
   done** in order to accept the story and the process starts again from **1.**
