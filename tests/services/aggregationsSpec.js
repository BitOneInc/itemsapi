var should = require('should');
var setup = require('./../mocks/setup');
var assert = require('assert');
var _ = require('lodash')

setup.makeSuite('search service', function() {

  var searchService = require('./../../src/services/search');
  var dataService = require('./../../src/services/data');
  var projectService = require('./../../src/services/project');
  var importService = require('./../../src/services/import');
  var elasticTools = require('./../../src/elastic/tools');
  var fs = require('fs-extra');

  before(function(done) {

    fs.readFileAsync(__dirname + '/../fixtures/movies_aggregations.json')
    .then(function(res) {
      return JSON.parse(res);
    })
    .then(function(res) {
      return importService.importAsync({
        collectionName: 'movie',
        index: 'test',
        body: res
      })
    })
    .delay(10)
    .then(function(res) {
      return elasticTools.refreshAsync({
        index: 'test'
      }).then(function(res) {
        done();
      })
    })
  });

  it('should get movies aggregations', function(done) {
    searchService.searchAsync({
      collectionName: 'movie',
      index: 'test',
    }).then(function(res) {
      var aggregations = res.data.aggregations
      var tags = aggregations.tags
      var buckets = tags.buckets
      buckets.should.have.lengthOf(4)
      _.map(buckets, 'key').should.eql(
        ['b', 'c', 'd', 'a']
      )
      done();
    });
  });

  it('should get processed aggregation', function(done) {
    searchService.getProcessedFacetAsync({
      collectionName: 'movie',
      facetName: 'tags',
      per_page: 4
    }).then(function(res) {
      res.should.have.properties(['data', 'pagination', 'meta'])
      res.pagination.should.have.properties({
        page: 1,
        per_page: 4,
        total: 4
      })

      _.map(res.data.buckets, 'key').should.eql(
        ['b', 'c', 'd', 'a']
      )
      done();
    })
  });

  it('should  processed aggregation with pagination', function(done) {
    searchService.getProcessedFacetAsync({
      collectionName: 'movie',
      facetName: 'tags',
      per_page: 2,
      page: 2
    }).then(function(res) {
      res.should.have.properties(['data', 'pagination', 'meta'])
      res.pagination.should.have.properties({
        page: 2,
        per_page: 2,
        total: 4
      })

      _.map(res.data.buckets, 'key').should.eql(
        ['d', 'a']
      )
      done();
    })
  });

  it('should get processed asc sorted aggregation', function(done) {
    searchService.getProcessedFacetAsync({
      collectionName: 'movie',
      facetName: 'tags',
      per_page: 4,
      sort: '_term',
      order: 'asc'
    }).then(function(res) {
      res.should.have.properties(['data', 'pagination', 'meta'])
      res.pagination.should.have.properties({
        page: 1,
        per_page: 4,
        total: 4
      })
      _.map(res.data.buckets, 'key').should.eql(
        ['a', 'b', 'c', 'd']
      )
      done();
    })
  })

  it('should get processed desc sorted aggregation', function(done) {
    searchService.getProcessedFacetAsync({
      collectionName: 'movie',
      facetName: 'tags',
      per_page: 4,
      sort: '_term',
      order: 'desc'
    }).then(function(res) {
      res.should.have.properties(['data', 'pagination', 'meta'])
      res.pagination.should.have.properties({
        page: 1,
        per_page: 4,
        total: 4
      })
      _.map(res.data.buckets, 'key').should.eql(
        ['d', 'c', 'b', 'a']
      )
      done();
    })
  })

  it('should not get movie notexistent_terms facet', function(done) {
    searchService.getFacetAsync({
      collectionName: 'movie',
      facetName: 'notexistent_terms'
    }).catch(function(res) {
      done();
    })
  })
})