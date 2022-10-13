

window.addEventListener('DOMContentLoaded', (event) => {

  // javascript-astar 0.4.1
  // http://github.com/bgrins/javascript-astar
  // Freely distributable under the MIT License.
  // Implements the astar search algorithm in javascript using a Binary Heap.
  // Includes Binary Heap (with modifications) from Marijn Haverbeke.
  // http://eloquentjavascript.net/appendix2.html
  (function (definition) {
    /* global module, define */
    if (typeof module === 'object' && typeof module.exports === 'object') {
      module.exports = definition();
    } else if (typeof define === 'function' && define.amd) {
      define([], definition);
    } else {
      var exports = definition();
      window.astar = exports.astar;
      window.Graph = exports.Graph;
    }
  })(function () {

    function pathTo(agent, node) {
      // agent.index = 0
      // agent.index = 0
      // ////console.log(agent)
      var curr = node;
      var path = [];
      //////////////////console.log(curr, curr.parent)
      while (curr.parent) {
        path.unshift(curr);
        curr = curr.parent;
      }

      // //console.log(agent)
      agent.awaiting = 0
      agent.index = 0
      agent.isTowardFlag = 1
      path.unshift(curr);
      agent.realPath = [...path]
      return path;
    }

    function getHeap() {
      return new BinaryHeap(function (node) {
        return node.f;
      });
    }

    var astar = {
      /**
      * Perform an A* Search on a graph given a start and end node.
      * @param {Graph} graph
      * @param {GridNode} start
      * @param {GridNode} end
      * @param {Object} [options]
      * @param {bool} [options.closest] Specifies whether to return the
                 path to the closest node if the target is unreachable.
      * @param {Function} [options.heuristic] Heuristic function (see
      *          astar.heuristics).
      */
      search: function (graph, start, end, options, agent, time, Fstop = 0) {
        //   //////////////////console.log(graph)
        if(agent.totalPathingLimitForAI > 0 && campaignController.mission == -1){
          return [...agent.realPath]
        }
        graph.cleanDirty();
        options = options || {};
        var heuristic = options.heuristic || astar.heuristics.diagonal;
        var closest = options.closest || false;

        var openHeap = getHeap();
        var closestNode = start; // set the start node to be the closest if required

        start.h = heuristic(start, end);
        graph.markDirty(start);

        openHeap.push(start);
        let brecount = 0

        var retrack = graph.allNeighbors(end);
        // ////////console.log(retrack)
        let wallcount = 0
        for(let t = 0;t<retrack.length;t++){
          if(retrack[t].isWall(agent)){
            wallcount++
          }
        }

        let steps = 0
        while (openHeap.size() > 0) {
          steps++
          brecount++

          // if ( wallcount>7) { 
          //   return [...agent.realPath]
          // }
          // if(brecount == 1){
          // ////////////console.log(openHeap.size())


          // }
          // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
          var currentNode = openHeap.pop();
          // map_context.fillStyle = `rgba(${255 - (brecount * .25)},${brecount * .1},${brecount * .01},.5)`
          // map_context.fillRect(currentNode.x, currentNode.y, 10, 10)
          // let link = new LineOP(start, currentNode, "Orange", 1)
          // link.draw()
          // let link2 = new LineOP(end, currentNode, "blue", 1)
          // link2.draw()

          // End case -- result has been found, return the traced path.

          if ((time - Date.now() < -11 && agent.faction.isAI == 1 && closest && steps > agent.stack) && campaignController.mission == -1) { //timelimit
            // if(end.sourcerock > 0){
            // return [...agent.realPath]
            // }
            agent.stack *= 1.4
            if(agent.stack > 100000){
              agent.stack = 100000
            }
            if (closest) {
              return pathTo(agent, currentNode);
            }
          }
          if (openHeap.size() > (agent.stack*.5)) { //3 .//&& agent.faction.isAI == 1 //1.5  //256
            // ////////console.log(agent)
            agent.stack *= 1.4
            if(agent.stack > 200000){
              agent.stack = 200000
            }
            agent.shouldMove = 0
            if(agent.realPath.includes(end)){
              if(agent.realPath.length>3){
                // agent.ultrabreak = agent.realPath[agent.realPath.length-2]
                if (closest) {
                  return pathTo(agent, closestNode);
                }
                // return [...agent.realPath]
              }
            }else{

              return [...agent.realPath]
              // if (closest) {
              //   return pathTo(agent, closestNode);
              // }
            }
            ////////////console.log(end, start, openHeap.size())
          }
          if (time - Date.now() < -12 && agent.faction.isAI == 1 && campaignController.mission == -1){//timelimit
            // if(end.sourcerock > 0){
            // ////////console.log(agent.stack)

            agent.stack *= 1.4
            if(agent.stack > 200000){
              agent.stack = 200000
            }
              agent.totalPathingLimitForAI = 0
            if (closest) {
              return pathTo(agent, currentNode);
            }
              // return [...agent.realPath]
            // }
        }
          if (currentNode === end) {
            agent.stack = 8000
            return pathTo(agent, currentNode);
          }

          // Normal case -- move currentNode from open to closed, process each of its neighbors.
          currentNode.closed = true;

          // Find all neighbors for the current node.
          var neighbors = graph.neighbors(currentNode);
          //////////////console.log(neighbors)
          for (var i = 0, il = neighbors.length; i < il; ++i) {
            var neighbor = neighbors[i];
            //////////////////console.log(neighbor)
            // 
            // if (neighbor.closed || !neighbor.isWall() || (neighbor.occupied && neighbor.occupant.faction.id == agent.faction.id) ) {
            if (neighbor.closed || neighbor.isWall(agent) && (neighbor != end)) {
              // Not a valid node to process, skip to next neighbor.
              continue;
            }

            // The g score is the shortest distance from start to current node.
            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            var gScore = currentNode.g + neighbor.getCost(currentNode);
            var beenVisited = neighbor.visited;

            //////////////console.log(gScore, neighbor.g)
            if (!beenVisited || gScore < neighbor.g) {
              // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
              neighbor.visited = true;
              neighbor.parent = currentNode;
              neighbor.h = neighbor.h || heuristic(neighbor, end);
              neighbor.g = gScore;
              neighbor.f = neighbor.g + neighbor.h;
              graph.markDirty(neighbor);
              if (closest) {
                // If the neighbour is closer than the current closestNode or if it's equally close but has
                // a cheaper path than the current closest node then it becomes the closest node
                if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                  closestNode = neighbor;
                }
              }

              if (!beenVisited) {
                // Pushing to heap will put it in proper place based on the 'f' value.
                openHeap.push(neighbor);
              } else {
                // Already seen the node, but since it has been rescored we need to reorder it in the heap
                openHeap.rescoreElement(neighbor);
              }
            }
          }
        }
        //////////////////console.log(pathTo(agent, closestNode), closestNode)

        if (closest) {

          agent.stack = 8000
          return pathTo(agent, closestNode);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
      },
      // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
      heuristics: {
        manhattan: function (pos0, pos1) {
          var d1 = Math.abs(pos1.x - pos0.x);
          var d2 = Math.abs(pos1.y - pos0.y);
          return d1 + d2;
        },
        diagonal: function (pos0, pos1) {
          var D = 1;
          var D2 = Math.sqrt(2);
          var d1 = Math.abs(pos1.x - pos0.x);
          var d2 = Math.abs(pos1.y - pos0.y);
          return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
        }
      },
      cleanNode: function (node) {
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.visited = false;
        node.dirty = false;
        node.closed = false;
        node.parent = null;
      }
    };

    /**
     * A graph memory structure
     * @param {Array} gridIn 2D array of input weights
     * @param {Object} [options]
     * @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
     */
    function Graph(gridIn, options) {
      options = options || {};
      this.nodes = [];
      this.diagonal = !!options.diagonal;
      this.grid = [];
      for (var x = 0; x < gridIn.length; x++) {
        this.grid[x] = [];

        for (var y = 0, row = gridIn[x]; y < row.length; y++) {
          var node = new GridNode(x, y, row[y]);
          this.grid[x][y] = node;
          this.nodes.push(node);
        }
      }
      this.init();
    }

    Graph.prototype.init = function () {
      this.dirtyNodes = [];
      for (var i = 0; i < this.nodes.length; i++) {
        astar.cleanNode(this.nodes[i]);
      }
    };

    Graph.prototype.cleanDirty = function () {
      for (var i = 0; i < this.dirtyNodes.length; i++) {
        astar.cleanNode(this.dirtyNodes[i]);
      }
      this.dirtyNodes = [];
    };

    Graph.prototype.markDirty = function (node) {
      this.dirtyNodes.push(node);
    };

    Graph.prototype.neighbors = function (node) {
      var ret = [];
      var x = node.x;
      var y = node.y;
      var grid = this.grid;

      // West
      if (grid[x - 1] && grid[x - 1][y]) {
        ret.push(grid[x - 1][y]);
      }

      // East
      if (grid[x + 1] && grid[x + 1][y]) {
        ret.push(grid[x + 1][y]);
      }

      // South
      if (grid[x] && grid[x][y - 1]) {
        ret.push(grid[x][y - 1]);
      }

      // North
      if (grid[x] && grid[x][y + 1]) {
        ret.push(grid[x][y + 1]);
      }

      if (this.diagonal) {
        // Southwest
        if (grid[x - 1] && grid[x - 1][y - 1]) {
          ret.push(grid[x - 1][y - 1]);
        }

        // Southeast
        if (grid[x + 1] && grid[x + 1][y - 1]) {
          ret.push(grid[x + 1][y - 1]);
        }

        // Northwest
        if (grid[x - 1] && grid[x - 1][y + 1]) {
          ret.push(grid[x - 1][y + 1]);
        }

        // Northeast
        if (grid[x + 1] && grid[x + 1][y + 1]) {
          ret.push(grid[x + 1][y + 1]);
        }
      }

      return ret;
    };

    Graph.prototype.toString = function () {
      var graphString = [];
      var nodes = this.grid;
      for (var x = 0; x < nodes.length; x++) {
        var rowDebug = [];
        var row = nodes[x];
        for (var y = 0; y < row.length; y++) {
          rowDebug.push(row[y].weight);
        }
        graphString.push(rowDebug.join(" "));
      }
      return graphString.join("\n");
    };

    function GridNode(x, y, weight) {
      this.x = x;
      this.y = y;
      this.weight = weight;
    }

    GridNode.prototype.toString = function () {
      return "[" + this.x + " " + this.y + "]";
    };

    GridNode.prototype.getCost = function (fromNeighbor) {
      // Take diagonal weight into consideration.
      if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
        return this.weight * 1.41421;
      }
      return this.weight;
    };

    GridNode.prototype.isWall = function () {
      return this.weight === 0;
    };

    function BinaryHeap(scoreFunction) {
      this.content = [];
      this.scoreFunction = scoreFunction;
    }

    BinaryHeap.prototype = {
      push: function (element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
      },
      pop: function () {
        // Store the first element so we can return it later.
        var result = this.content[0];
        // Get the element at the end of the array.
        var end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
          this.content[0] = end;
          this.bubbleUp(0);
        }
        return result;
      },
      remove: function (node) {
        var i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
          this.content[i] = end;

          if (this.scoreFunction(end) < this.scoreFunction(node)) {
            this.sinkDown(i);
          } else {
            this.bubbleUp(i);
          }
        }
      },
      size: function () {
        return this.content.length;
      },
      rescoreElement: function (node) {
        this.sinkDown(this.content.indexOf(node));
      },
      sinkDown: function (n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

          // Compute the parent element's index, and fetch it.
          var parentN = ((n + 1) >> 1) - 1;
          var parent = this.content[parentN];
          // Swap the elements if the parent is greater.
          if (this.scoreFunction(element) < this.scoreFunction(parent)) {
            this.content[parentN] = element;
            this.content[n] = parent;
            // Update 'n' to continue at the new position.
            n = parentN;
          }
          // Found a parent that is less, no need to sink any further.
          else {
            break;
          }
        }
      },
      bubbleUp: function (n) {
        // Look up the target element and its score.
        var length = this.content.length;
        var element = this.content[n];
        var elemScore = this.scoreFunction(element);

        while (true) {
          // Compute the indices of the child elements.
          var child2N = (n + 1) << 1;
          var child1N = child2N - 1;
          // This is used to store the new position of the element, if any.
          var swap = null;
          var child1Score;
          // If the first child exists (is inside the array)...
          if (child1N < length) {
            // Look it up and compute its score.
            var child1 = this.content[child1N];
            child1Score = this.scoreFunction(child1);

            // If the score is less than our element's, we need to swap.
            if (child1Score < elemScore) {
              swap = child1N;
            }
          }

          // Do the same checks for the other child.
          if (child2N < length) {
            var child2 = this.content[child2N];
            var child2Score = this.scoreFunction(child2);
            if (child2Score < (swap === null ? elemScore : child1Score)) {
              swap = child2N;
            }
          }

          // If the element needs to be moved, swap it, and continue.
          if (swap !== null) {
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
          }
          // Otherwise, we are done.
          else {
            break;
          }
        }
      }
    };

    return {
      astar: astar,
      Graph: Graph
    };

  });

})