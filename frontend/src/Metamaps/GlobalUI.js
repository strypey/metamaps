/* global Metamaps, $, Hogan, Bloodhound */
import Active from './Active'
import Create from './Create'
import Filter from './Filter'
import Router from './Router'

/*
 * Metamaps.Backbone
 * Metamaps.Erb
 * Metamaps.Maps
 */

const GlobalUI = {
  notifyTimeout: null,
  lightbox: null,
  init: function () {
    var self = GlobalUI;

    self.Search.init();
    self.CreateMap.init();
    self.Account.init();

    if ($('#toast').html().trim()) self.notifyUser($('#toast').html())

    //bind lightbox clicks
    $('.openLightbox').click(function (event) {
      self.openLightbox($(this).attr('data-open'));
      event.preventDefault();
      return false;
    });

    $('#lightbox_screen, #lightbox_close').click(self.closeLightbox);

    // initialize global backbone models and collections
    if (Active.Mapper) Active.Mapper = new Metamaps.Backbone.Mapper(Active.Mapper);

    var myCollection = Metamaps.Maps.Mine ? Metamaps.Maps.Mine : [];
    var sharedCollection = Metamaps.Maps.Shared ? Metamaps.Maps.Shared : [];
    var starredCollection = Metamaps.Maps.Starred ? Metamaps.Maps.Starred : [];
    var mapperCollection = [];
    var mapperOptionsObj = {id: 'mapper', sortBy: 'updated_at' };
    if (Metamaps.Maps.Mapper) {
      mapperCollection = Metamaps.Maps.Mapper.models;
      mapperOptionsObj.mapperId = Metamaps.Maps.Mapper.id;
    }
    var featuredCollection = Metamaps.Maps.Featured ? Metamaps.Maps.Featured : [];
    var activeCollection = Metamaps.Maps.Active ? Metamaps.Maps.Active : [];
    Metamaps.Maps.Mine = new Metamaps.Backbone.MapsCollection(myCollection, {id: 'mine', sortBy: 'updated_at' });
    Metamaps.Maps.Shared = new Metamaps.Backbone.MapsCollection(sharedCollection, {id: 'shared', sortBy: 'updated_at' });
    Metamaps.Maps.Starred = new Metamaps.Backbone.MapsCollection(starredCollection, {id: 'starred', sortBy: 'updated_at' });
    // 'Mapper' refers to another mapper
    Metamaps.Maps.Mapper = new Metamaps.Backbone.MapsCollection(mapperCollection, mapperOptionsObj);
    Metamaps.Maps.Featured = new Metamaps.Backbone.MapsCollection(featuredCollection, {id: 'featured', sortBy: 'updated_at' });
    Metamaps.Maps.Active = new Metamaps.Backbone.MapsCollection(activeCollection, {id: 'active', sortBy: 'updated_at' });
  },
  showDiv: function (selector) {
    $(selector).show()
    $(selector).animate({
      opacity: 1
    }, 200, 'easeOutCubic')
  },
  hideDiv: function (selector) {
    $(selector).animate({
      opacity: 0
    }, 200, 'easeInCubic', function () { $(this).hide() })
  },
  openLightbox: function (which) {
    var self = GlobalUI;

    $('.lightboxContent').hide();
    $('#' + which).show();

    self.lightbox = which;

    $('#lightbox_overlay').show();

    var heightOfContent = '-' + ($('#lightbox_main').height() / 2) + 'px';
    // animate the content in from the bottom
    $('#lightbox_main').animate({
      'top': '50%',
      'margin-top': heightOfContent
    }, 200, 'easeOutCubic');

    // fade the black overlay in
    $('#lightbox_screen').animate({
      'opacity': '0.42'
    }, 200);

    if (which == "switchMetacodes") {
      Create.isSwitchingSet = true;
    }
  },

  closeLightbox: function (event) {
    var self = GlobalUI;

    if (event) event.preventDefault();

    // animate the lightbox content offscreen
    $('#lightbox_main').animate({
      'top': '100%',
      'margin-top': '0'
    }, 200, 'easeInCubic');

    // fade the black overlay out
    $('#lightbox_screen').animate({
      'opacity': '0.0'
    }, 200, function () {
      $('#lightbox_overlay').hide();
    });

    if (self.lightbox === 'forkmap') GlobalUI.CreateMap.reset('fork_map');
    if (self.lightbox === 'newmap') GlobalUI.CreateMap.reset('new_map');
    if (Create && Create.isSwitchingSet) {
      Create.cancelMetacodeSetSwitch();
    }
    self.lightbox = null;
  },
  notifyUser: function (message, leaveOpen) {
    var self = GlobalUI;

    $('#toast').html(message)
    self.showDiv('#toast')
    clearTimeout(self.notifyTimeOut);
    if (!leaveOpen) {
      self.notifyTimeOut = setTimeout(function () {
        self.hideDiv('#toast')
      }, 8000);
    }
  },
  clearNotify: function() {
    var self = GlobalUI;

    clearTimeout(self.notifyTimeOut);
    self.hideDiv('#toast')
  },
  shareInvite: function(inviteLink) {
    window.prompt("To copy the invite link, press: Ctrl+C, Enter", inviteLink);
  }
}

GlobalUI.CreateMap = {
  newMap: null,
  emptyMapForm: "",
  emptyForkMapForm: "",
  topicsToMap: [],
  synapsesToMap: [],
  init: function () {
    var self = GlobalUI.CreateMap;

    self.newMap = new Metamaps.Backbone.Map({ permission: 'commons' });

    self.bindFormEvents();

    self.emptyMapForm = $('#new_map').html();

  },
  bindFormEvents: function () {
    var self = GlobalUI.CreateMap;

    $('.new_map input, .new_map div').unbind('keypress').bind('keypress', function(event) {
      if (event.keyCode === 13) self.submit()
    })

    $('.new_map button.cancel').unbind().bind('click', function (event) {
      event.preventDefault();
      GlobalUI.closeLightbox();
    });
    $('.new_map button.submitMap').unbind().bind('click', self.submit);

    // bind permission changer events on the createMap form
    $('.permIcon').unbind().bind('click', self.switchPermission);
  },
  closeSuccess: function () {
    $('#mapCreatedSuccess').fadeOut(300, function(){
      $(this).remove();
    });
  },
  generateSuccessMessage: function (id) {
    var stringStart = "<div id='mapCreatedSuccess'><h6>SUCCESS!</h6>Your map has been created. Do you want to: <a id='mapGo' href='/maps/";
    stringStart += id;
    stringStart += "' onclick='GlobalUI.CreateMap.closeSuccess();'>Go to your new map</a>";
    stringStart += "<span>OR</span><a id='mapStay' href='#' onclick='GlobalUI.CreateMap.closeSuccess(); return false;'>Stay on this ";
    var page = Active.Map ? 'map' : 'page';
    var stringEnd = "</a></div>";
    return stringStart + page + stringEnd;
  },
  switchPermission: function () {
    var self = GlobalUI.CreateMap;

    self.newMap.set('permission', $(this).attr('data-permission'));
    $(this).siblings('.permIcon').find('.mapPermIcon').removeClass('selected');
    $(this).find('.mapPermIcon').addClass('selected');

    var permText = $(this).find('.tip').html();
    $(this).parents('.new_map').find('.permText').html(permText);
  },
  submit: function (event) {
    if (event) event.preventDefault();

    var self = GlobalUI.CreateMap;

    if (GlobalUI.lightbox === 'forkmap') {
      self.newMap.set('topicsToMap', self.topicsToMap);
      self.newMap.set('synapsesToMap', self.synapsesToMap);
    }

    var formId = GlobalUI.lightbox === 'forkmap' ? '#fork_map' : '#new_map';
    var $form = $(formId);

    self.newMap.set('name', $form.find('#map_name').val());
    self.newMap.set('desc', $form.find('#map_desc').val());

    if (self.newMap.get('name').length===0){
      self.throwMapNameError();
      return;
    }

    self.newMap.save(null, {
      success: self.success
      // TODO add error message
    });

    GlobalUI.closeLightbox();
    GlobalUI.notifyUser('Working...');
  },
  throwMapNameError: function () {
    var self = GlobalUI.CreateMap;

    var formId = GlobalUI.lightbox === 'forkmap' ? '#fork_map' : '#new_map';
    var $form = $(formId);

    var message = $("<div class='feedback_message'>Please enter a map name...</div>");

    $form.find('#map_name').after(message);
    setTimeout(function(){
      message.fadeOut('fast', function(){
        message.remove();
      });
    }, 5000);
  },
  success: function (model) {
    var self = GlobalUI.CreateMap;

    //push the new map onto the collection of 'my maps'
    Metamaps.Maps.Mine.add(model);

    var formId = GlobalUI.lightbox === 'forkmap' ? '#fork_map' : '#new_map';
    var form = $(formId);

    GlobalUI.clearNotify();
    $('#wrapper').append(self.generateSuccessMessage(model.id));

  },
  reset: function (id) {
    var self = GlobalUI.CreateMap;

    var form = $('#' + id);

    if (id === "fork_map") {
      self.topicsToMap = [];
      self.synapsesToMap = [];
      form.html(self.emptyForkMapForm);
    }
    else {
      form.html(self.emptyMapForm);
    }

    self.bindFormEvents();
    self.newMap = new Metamaps.Backbone.Map({ permission: 'commons' });

    return false;
  },
}

GlobalUI.Account = {
  isOpen: false,
  changing: false,
  init: function () {
    var self = GlobalUI.Account;

    $('.sidebarAccountIcon').click(self.toggleBox);
    $('.sidebarAccountBox').click(function(event){
      event.stopPropagation();
    });
    $('body').click(self.close);
  },
  toggleBox: function (event) {
    var self = GlobalUI.Account;

    if (self.isOpen) self.close();
    else self.open();

    event.stopPropagation();
  },
  open: function () {
    var self = GlobalUI.Account;

    Filter.close();
    $('.sidebarAccountIcon .tooltipsUnder').addClass('hide');


    if (!self.isOpen && !self.changing) {
      self.changing = true;
      $('.sidebarAccountBox').fadeIn(200, function () {
        self.changing = false;
        self.isOpen = true;
        $('.sidebarAccountBox #user_email').focus();
      });
    }
  },
  close: function () {
    var self = GlobalUI.Account;

    $('.sidebarAccountIcon .tooltipsUnder').removeClass('hide');
    if (!self.changing) {
      self.changing = true;
      $('.sidebarAccountBox #user_email').blur();
      $('.sidebarAccountBox').fadeOut(200, function () {
        self.changing = false;
        self.isOpen = false;
      });
    }
  }
}

GlobalUI.Search = {
  locked: false,
  isOpen: false,
  limitTopicsToMe: false,
  limitMapsToMe: false,
  timeOut: null,
  changing: false,
  optionsInitialized: false,
  init: function () {
    var self = GlobalUI.Search;

    var loader = new CanvasLoader('searchLoading');
    loader.setColor('#4fb5c0'); // default is '#000000'
    loader.setDiameter(24); // default is 40
    loader.setDensity(41); // default is 40
    loader.setRange(0.9); // default is 1.3
    loader.show(); // Hidden by default

    // bind the hover events
    $(".sidebarSearch").hover(function () {
      self.open()
    }, function () {
      self.close(800, false)
    });

    $('.sidebarSearchIcon').click(function (e) {
      $('.sidebarSearchField').focus();
    });
    $('.sidebarSearch').click(function (e) {
      e.stopPropagation();
    });
    $('body').click(function (e) {
      self.close(0, false);
    });

    // open if the search is closed and user hits ctrl+/
    // close if they hit ESC
    $('body').bind('keyup', function (e) {
      switch (e.which) {
        case 191:
          if ((e.ctrlKey && !self.isOpen) || (e.ctrlKey && self.locked)) {
            self.open(true); // true for focus
          }
          break;
        case 27:
          if (self.isOpen) {
            self.close(0, true);
          }
          break;

        default:
          break; //console.log(e.which);
      }
    });

    self.startTypeahead();
  },
  lock: function() {
    var self = GlobalUI.Search;
    self.locked = true;
  },
  unlock: function() {
    var self = GlobalUI.Search;
    self.locked = false;
  },
  open: function (focus) {
    var self = GlobalUI.Search;

    clearTimeout(self.timeOut);
    if (!self.isOpen && !self.changing && !self.locked) {
      self.changing = true;
      $('.sidebarSearch .twitter-typeahead, .sidebarSearch .tt-hint, .sidebarSearchField').animate({
        width: '400px'
      }, 300, function () {
        if (focus) $('.sidebarSearchField').focus();
        $('.sidebarSearchField, .sidebarSearch .tt-hint').css({
          padding: '7px 10px 3px 10px',
          width: '380px'
        });
        self.changing = false;
        self.isOpen = true;
      });
    }
  },
  close: function (closeAfter, bypass) {
    // for now
    return

    var self = GlobalUI.Search;

    self.timeOut = setTimeout(function () {
      if (!self.locked && !self.changing && self.isOpen && (bypass || $('.sidebarSearchField.tt-input').val() == '')) {
        self.changing = true;
        $('.sidebarSearchField, .sidebarSearch .tt-hint').css({
          padding: '7px 0 3px 0',
          width: '400px'
        });
        $('.sidebarSearch .twitter-typeahead, .sidebarSearch .tt-hint, .sidebarSearchField').animate({
          width: '0'
        }, 300, function () {
          $('.sidebarSearchField').typeahead('val', '');
          $('.sidebarSearchField').blur();
          self.changing = false;
          self.isOpen = false;
        });
      }
    }, closeAfter);
  },
  startTypeahead: function () {
    var self = GlobalUI.Search;

    var mapheader = Active.Mapper ? '<div class="searchMapsHeader searchHeader"><h3 class="search-heading">Maps</h3><input type="checkbox" class="limitToMe" id="limitMapsToMe"></input><label for="limitMapsToMe" class="limitToMeLabel">added by me</label><div class="minimizeResults minimizeMapResults"></div><div class="clearfloat"></div></div>' : '<div class="searchMapsHeader searchHeader"><h3 class="search-heading">Maps</h3><div class="minimizeResults minimizeMapResults"></div><div class="clearfloat"></div></div>';
    var topicheader = Active.Mapper ? '<div class="searchTopicsHeader searchHeader"><h3 class="search-heading">Topics</h3><input type="checkbox" class="limitToMe" id="limitTopicsToMe"></input><label for="limitTopicsToMe" class="limitToMeLabel">added by me</label><div class="minimizeResults minimizeTopicResults"></div><div class="clearfloat"></div></div>' : '<div class="searchTopicsHeader searchHeader"><h3 class="search-heading">Topics</h3><div class="minimizeResults minimizeTopicResults"></div><div class="clearfloat"></div></div>';
    var mapperheader = '<div class="searchMappersHeader searchHeader"><h3 class="search-heading">Mappers</h3><div class="minimizeResults minimizeMapperResults"></div><div class="clearfloat"></div></div>';

    var topics = {
      name: 'topics',
      limit: 9999,

      display: function(s) { return s.label; },
      templates: {
        notFound: function(s) {
          return Hogan.compile(topicheader + $('#topicSearchTemplate').html()).render({
            value: "No results",
            label: "No results",
            typeImageURL: Metamaps.Erb['icons/wildcard.png'],
            rtype: "noresult"
          });
        },
        header: topicheader,
        suggestion: function(s) {
          return Hogan.compile($('#topicSearchTemplate').html()).render(s);
        },
      },
      source: new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/search/topics',
          prepare: function(query, settings) {
            settings.url += '?term=' + query;
            if (Active.Mapper && self.limitTopicsToMe) {
              settings.url += "&user=" + Active.Mapper.id.toString();
            }
            return settings;
          },
        },
      }),
    };

    var maps = {
      name: 'maps',
      limit: 9999,
      display: function(s) { return s.label; },
      templates: {
        notFound: function(s) {
          return Hogan.compile(mapheader + $('#mapSearchTemplate').html()).render({
            value: "No results",
            label: "No results",
            rtype: "noresult"
          });
        },
        header: mapheader,
        suggestion: function(s) {
          return Hogan.compile($('#mapSearchTemplate').html()).render(s);
        },
      },
      source: new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/search/maps',
          prepare: function(query, settings) {
            settings.url += '?term=' + query;
            if (Active.Mapper && self.limitMapsToMe) {
              settings.url += "&user=" + Active.Mapper.id.toString();
            }
            return settings;
          },
        },
      }),
    };

    var mappers = {
      name: 'mappers',
      limit: 9999,
      display: function(s) { return s.label; },
      templates: {
        notFound: function(s) {
          return Hogan.compile(mapperheader + $('#mapperSearchTemplate').html()).render({
            value: "No results",
            label: "No results",
            rtype: "noresult",
            profile: Metamaps.Erb['user.png']
          });
        },
        header: mapperheader,
        suggestion: function(s) {
          return Hogan.compile($('#mapperSearchTemplate').html()).render(s);
        },
      },
      source: new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        remote: {
          url: '/search/mappers?term=%QUERY',
          wildcard: '%QUERY',
        },
      }),
    };

    // Take all that crazy setup data and put it together into one beautiful typeahead call!
    $('.sidebarSearchField').typeahead(
      {
        highlight: true,
      },
      [topics, maps, mappers]
    );

    //Set max height of the search results box to prevent it from covering bottom left footer
    $('.sidebarSearchField').bind('typeahead:render', function (event) {
      self.initSearchOptions();
      self.hideLoader();
      var h = $(window).height();
      $(".tt-dropdown-menu").css('max-height', h - 100);
      if (self.limitTopicsToMe) {
        $('#limitTopicsToMe').prop('checked', true);
      }
      if (self.limitMapsToMe) {
        $('#limitMapsToMe').prop('checked', true);
      }
    });
    $(window).resize(function () {
      var h = $(window).height();
      $(".tt-dropdown-menu").css('max-height', h - 100);
    });

    // tell the autocomplete to launch a new tab with the topic, map, or mapper you clicked on
    $('.sidebarSearchField').bind('typeahead:select', self.handleResultClick);

    // don't do it, if they clicked on a 'addToMap' button
    $('.sidebarSearch button.addToMap').click(function (event) {
      event.stopPropagation();
    });

    // make sure that when you click on 'limit to me' or 'toggle section' it works
    $('.sidebarSearchField.tt-input').keyup(function(){
      if ($('.sidebarSearchField.tt-input').val() === '') {
        self.hideLoader();
      } else {
        self.showLoader();
      }
    });

  },
  handleResultClick: function (event, datum, dataset) {
    var self = GlobalUI.Search;

    self.hideLoader();

    if (["topic", "map", "mapper"].indexOf(datum.rtype) !== -1) {
      self.close(0, true);
      if (datum.rtype == "topic") {
        Router.topics(datum.id);
      } else if (datum.rtype == "map") {
        Router.maps(datum.id);
      } else if (datum.rtype == "mapper") {
        Router.explore("mapper", datum.id);
      }
    }
  },
  initSearchOptions: function () {
    var self = GlobalUI.Search;

    function toggleResultSet(set) {
      var s = $('.tt-dataset-' + set + ' .tt-suggestion, .tt-dataset-' + set + ' .resultnoresult');
      if (s.is(':visible')) {
        s.hide();
        $(this).removeClass('minimizeResults').addClass('maximizeResults');
      } else {
        s.show();
        $(this).removeClass('maximizeResults').addClass('minimizeResults');
      }
    }

    $('.limitToMe').unbind().bind("change", function (e) {
      if ($(this).attr('id') == 'limitTopicsToMe') {
        self.limitTopicsToMe = !self.limitTopicsToMe;
      }
      if ($(this).attr('id') == 'limitMapsToMe') {
        self.limitMapsToMe = !self.limitMapsToMe;
      }

      // set the value of the search equal to itself to retrigger the
      // autocomplete event
      var searchQuery = $('.sidebarSearchField.tt-input').val();
      $(".sidebarSearchField").typeahead('val', '')
        .typeahead('val', searchQuery);
    });

    // when the user clicks minimize section, hide the results for that section
    $('.minimizeMapperResults').unbind().click(function (e) {
      toggleResultSet.call(this, 'mappers');
    });
    $('.minimizeTopicResults').unbind().click(function (e) {
      toggleResultSet.call(this, 'topics');
    });
    $('.minimizeMapResults').unbind().click(function (e) {
      toggleResultSet.call(this, 'maps');
    });
  },
  hideLoader: function () {
    $('#searchLoading').hide();
  },
  showLoader: function () {
    $('#searchLoading').show();
  }
}

export default GlobalUI