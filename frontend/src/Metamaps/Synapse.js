/* global Metamaps, $ */

import Active from './Active'
import Control from './Control'
import Create from './Create'
import JIT from './JIT'
import Map from './Map'
import Selected from './Selected'
import Settings from './Settings'
import Visualize from './Visualize'

/*
 * Metamaps.Synapse.js.erb
 *
 * Dependencies:
 *  - Metamaps.Backbone
 *  - Metamaps.Mappings
 *  - Metamaps.Synapses
 *  - Metamaps.Topics
 */

const Synapse = {
  // this function is to retrieve a synapse JSON object from the database
  // @param id = the id of the synapse to retrieve
  get: function (id, callback) {
    // if the desired topic is not yet in the local topic repository, fetch it
    if (Metamaps.Synapses.get(id) == undefined) {
      if (!callback) {
        var e = $.ajax({
          url: '/synapses/' + id + '.json',
          async: false
        })
        Metamaps.Synapses.add($.parseJSON(e.responseText))
        return Metamaps.Synapses.get(id)
      } else {
        return $.ajax({
          url: '/synapses/' + id + '.json',
          success: function (data) {
            Metamaps.Synapses.add(data)
            callback(Metamaps.Synapses.get(id))
          }
        })
      }
    } else {
      if (!callback) {
        return Metamaps.Synapses.get(id)
      } else {
        return callback(Metamaps.Synapses.get(id))
      }
    }
  },
  /*
   *
   *
   */
  renderSynapse: function (mapping, synapse, node1, node2, createNewInDB) {
    var self = Synapse

    var edgeOnViz

    var newedge = synapse.createEdge(mapping)

    Visualize.mGraph.graph.addAdjacence(node1, node2, newedge.data)
    edgeOnViz = Visualize.mGraph.graph.getAdjacence(node1.id, node2.id)
    synapse.set('edge', edgeOnViz)
    synapse.updateEdge() // links the synapse and the mapping to the edge

    Control.selectEdge(edgeOnViz)

    var mappingSuccessCallback = function (mappingModel, response) {
      var newSynapseData = {
        mappingid: mappingModel.id,
        mappableid: mappingModel.get('mappable_id')
      }

      $(document).trigger(JIT.events.newSynapse, [newSynapseData])
    }
    var synapseSuccessCallback = function (synapseModel, response) {
      if (Active.Map) {
        mapping.save({ mappable_id: synapseModel.id }, {
          success: mappingSuccessCallback
        })
      }
    }

    if (!Settings.sandbox && createNewInDB) {
      if (synapse.isNew()) {
        synapse.save(null, {
          success: synapseSuccessCallback,
          error: function (model, response) {
            console.log('error saving synapse to database')
          }
        })
      } else if (!synapse.isNew() && Active.Map) {
        mapping.save(null, {
          success: mappingSuccessCallback
        })
      }
    }
  },
  createSynapseLocally: function () {
    var self = Synapse,
      topic1,
      topic2,
      node1,
      node2,
      synapse,
      mapping

    $(document).trigger(Map.events.editedByActiveMapper)

    // for each node in this array we will create a synapse going to the position2 node.
    var synapsesToCreate = []

    topic2 = Metamaps.Topics.get(Create.newSynapse.topic2id)
    node2 = topic2.get('node')

    var len = Selected.Nodes.length
    if (len == 0) {
      topic1 = Metamaps.Topics.get(Create.newSynapse.topic1id)
      synapsesToCreate[0] = topic1.get('node')
    } else if (len > 0) {
      synapsesToCreate = Selected.Nodes
    }

    for (var i = 0; i < synapsesToCreate.length; i++) {
      node1 = synapsesToCreate[i]
      topic1 = node1.getData('topic')
      synapse = new Metamaps.Backbone.Synapse({
        desc: Create.newSynapse.description,
        node1_id: topic1.isNew() ? topic1.cid : topic1.id,
        node2_id: topic2.isNew() ? topic2.cid : topic2.id,
      })
      Metamaps.Synapses.add(synapse)

      mapping = new Metamaps.Backbone.Mapping({
        mappable_type: 'Synapse',
        mappable_id: synapse.cid,
      })
      Metamaps.Mappings.add(mapping)

      // this function also includes the creation of the synapse in the database
      self.renderSynapse(mapping, synapse, node1, node2, true)
    } // for each in synapsesToCreate

    Create.newSynapse.hide()
  },
  getSynapseFromAutocomplete: function (id) {
    var self = Synapse,
      topic1,
      topic2,
      node1,
      node2

    var synapse = self.get(id)

    var mapping = new Metamaps.Backbone.Mapping({
      mappable_type: 'Synapse',
      mappable_id: synapse.id,
    })
    Metamaps.Mappings.add(mapping)

    topic1 = Metamaps.Topics.get(Create.newSynapse.topic1id)
    node1 = topic1.get('node')
    topic2 = Metamaps.Topics.get(Create.newSynapse.topic2id)
    node2 = topic2.get('node')
    Create.newSynapse.hide()

    self.renderSynapse(mapping, synapse, node1, node2, true)
  }
}

export default Synapse