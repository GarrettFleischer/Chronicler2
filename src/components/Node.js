/**
 * Created by Garrett on 3/30/2017.
 */
import React from 'react';
import PureRenderMixin from 'react-addons-pure-render-mixin';
import {connect} from 'react-redux';
import {FindPathToId} from '../core';

export const Node = React.createClass({
    mixins: [PureRenderMixin],
    render: function() {
        const style = {
            left: props.state.get('X'),
            top: props.state.get('Y')
        };

        if (props.zoom === 0) {
            return (
                <div className="node zoomed">
                    zoomed
                </div>
            )
        }

        return (
            <div className="node" style={style}>
                {props.state.get('Label') ? <span>{props.state.get('Label')}</span> : <span>no label...</span>}
            </div>
        )
    }
});


function mapStateToProps(state) {
    return {
        node: state.getIn(FindPathToId(state, state.getIn(['View', 'CurrentNode']))),
        zoom: state.getIn(['View', 'Zoom'])
    };
}

export const NodeContainer = connect(mapStateToProps)(Node);
