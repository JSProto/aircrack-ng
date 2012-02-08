/*

 This file is part of Ext JS 4

 Copyright (c) 2011 Sencha Inc

 Contact:  http://www.sencha.com/contact

 GNU General Public License Usage
 This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

 If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

 */
Ext.Loader.setConfig({
    enabled : true
});

Ext.Loader.setPath('Ext.ux', '../ux/');
Ext.require(['Ext.grid.*', 'Ext.data.*', 'Ext.util.*', 'Ext.toolbar.Paging', 'Ext.ux.PreviewPlugin', 'Ext.ModelManager', 'Ext.tip.QuickTipManager']);
Ext.require(['Ext.grid.*', 'Ext.data.*', 'Ext.util.*', 'Ext.tip.QuickTipManager', 'Ext.ux.LiveSearchGridPanel']);

Ext.onReady(function() {
    Ext.QuickTips.init();
    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    function change(val) {
        if(val > 0) {
            return '<span style="color:green;">' + val + '</span>';
        } else if(val < 0) {
            return '<span style="color:red;">' + val + '</span>';
        }
        return val;
    }

    /**
     * Custom function used for column renderer
     * @param {Object} val
     */
    function pctChange(val) {
        if(val > 0) {
            return '<span style="color:green;">' + val + '%</span>';
        } else if(val < 0) {
            return '<span style="color:red;">' + val + '%</span>';
        }
        return val;
    }

    var pluginExpanded = true;
    Ext.define('ForumThread', {
        extend : 'Ext.data.Model',
        fields : [{
            name : 'url'
        }, {
            type : 'date',
            name : 'completed'
        }, {
            type : 'date',
            name : 'added'
        }, {
            name : 'availability'
        }, {
            name : 'ratio'
        }, {
            name : 'downloaded',
            type : 'int'
        }, {
            name : 'uploaded',
            type : 'int'
        }, {
            name : 'eta'
        }, {
            name : 'upspeed',
            type : 'float'
        }, {
            name : 'downspeed',
            type : 'float'
        }, {
            name : 'seeds_peers'
        }, {
            name : 'peers'
        }, {
            name : 'seeds'
        }, {
            name : 'status'
        }, {
            name : 'done'
        }, {
            name : 'remaining'
        }, {
            name : 'size'
        }, {
            name : 'name'
        }, {
            name : 'hash',
            type : 'float'
        }],
        idProperty : 'threadid'
    });
    store2 = Ext.create('Ext.data.Store', {
        // pageSize : 50,
        model : 'ForumThread',
        remoteSort : true,
        buffered : true,
        proxy : {
            // load using script tags for cross domain, if the data in on the same domain as
            // this page, an HttpProxy would be better
            type : 'jsonp',
            url : '/api/utorrent/server-name-2/torrent/all',
            reader : {
                root : 'topics',
                totalProperty : 'totalCount'
            },
            // sends single sort as multi parameter
            simpleSortMode : true
        },
        sorters : [{
            property : 'name',
            direction : 'DESC'
        }]
    });
    store1 = Ext.create('Ext.data.Store', {
        // pageSize : 50,
        model : 'ForumThread',
        remoteSort : true,
        buffered : true,
        proxy : {
            // load using script tags for cross domain, if the data in on the same domain as
            // this page, an HttpProxy would be better
            type : 'jsonp',
            url : '/api/utorrent/server-name-1/torrent/all',
            reader : {
                root : 'topics',
                totalProperty : 'totalCount'
            },
            // sends single sort as multi parameter
            simpleSortMode : true
        },
        sorters : [{
            property : 'name',
            direction : 'DESC'
        }]
    });

    FRAME5.hang.subscribe('server-name-2', function(data) {
        var from = data.from;
        var sentData = data.data;
        if(from.split(':').length == 2) {
            FRAME5.emit('sys:' + from, sentData)
        }

    })
    FRAME5.hang.startPool()
    // create the Grid
    var grid = Ext.create('Ext.ux.LiveSearchGridPanel', {
        store : store2,
        stateId : 'stateGrid',
        columns : [{
            text : 'Name',
            flex : 1,
            sortable : true,
            dataIndex : 'name'
        }, {
            text : 'Status',
            width : 75,
            sortable : true,
            dataIndex : 'status'
        }, {
            text : 'Completed On',
            flex : 1,
            sortable : true,
            dataIndex : 'completed'
        }, {
            text : 'Seeds',
            width : 75,
            sortable : true,
            dataIndex : 'seeds'
        }, {
            text : 'Peers',
            width : 75,
            sortable : true,
            dataIndex : 'peers'
        }, {
            text : 'Up KB/s',
            width : 75,
            sortable : true,
            dataIndex : 'upspeed',
            renderer : function(value) {
                return Ext.String.format('{0} KB/s', (value / 1024).toFixed(2));
            }
        }, {
            text : 'Down KB/s',
            width : 75,
            sortable : true,
            dataIndex : 'downspeed',
            renderer : function(value) {
                return Ext.String.format('{0} KB/s', (value / 1024).toFixed(2));
            }
        }, {
            text : 'Last Updated',
            width : 85,
            sortable : true,
            dataIndex : 'lastChange'
        }],
        width : Ext.Element.getViewportWidth() - 100,
        title : 'Array Grid',
        columnLines : true,
        height : 500,
        renderTo : Ext.getBody(),
        loadMask : true,
        viewConfig : {
            id : 'gv',
            trackOver : false,
            stripeRows : false,
            plugins : [{
                ptype : 'preview',
                bodyField : 'excerpt',
                expanded : true,
                pluginId : 'preview'
            }]
        },
        // paging bar on the bottom
        bbar : Ext.create('Ext.PagingToolbar', {
            store : store2,
            displayInfo : true,
            displayMsg : 'Displaying topics {0} - {1} of {2}',
            emptyMsg : "No topics to display",
            items : ['-', {
                text : 'Show Preview',
                pressed : pluginExpanded,
                enableToggle : true,
                toggleHandler : function(btn, pressed) {
                    var preview = Ext.getCmp('gv').getPlugin('preview');
                    preview.toggleExpanded(pressed);
                }
            }]
        }),

    }).show();
    /*====================================================================
     * CheckGroup example
     *====================================================================*/
    var checkGroup = {
        xtype : 'fieldset',
        title : 'Checkbox Groups (initially collapsed)',
        layout : 'anchor',
        defaults : {
            anchor : '100%',
            labelStyle : 'padding-left:4px;'
        },
        collapsible : true,
        collapsed : false,
        items : [{
            xtype : 'textfield',
            name : 'txt-test3',
            fieldLabel : 'Alignment Test'
        }, {
            // Use the default, automatic layout to distribute the controls evenly
            // across a single row
            xtype : 'checkboxgroup',
            fieldLabel : 'Auto Layout',
            cls : 'x-check-group-alt',
            items : [{
                boxLabel : 'Item 1',
                name : 'cb-auto-1'
            }, {
                boxLabel : 'Item 2',
                name : 'cb-auto-2',
                checked : true
            }, {
                boxLabel : 'Item 3',
                name : 'cb-auto-3'
            }, {
                boxLabel : 'Item 4',
                name : 'cb-auto-4'
            }, {
                boxLabel : 'Item 5',
                name : 'cb-auto-5'
            }]
        }, {
            xtype : 'checkboxgroup',
            fieldLabel : 'Single Column',
            // Put all controls in a single column with width 100%
            columns : 1,
            items : [{
                boxLabel : 'Item 1',
                name : 'cb-col-1'
            }, {
                boxLabel : 'Item 2',
                name : 'cb-col-2',
                checked : true
            }, {
                boxLabel : 'Item 3',
                name : 'cb-col-3'
            }]
        }, {
            xtype : 'checkboxgroup',
            fieldLabel : 'Multi-Column (horizontal)',
            cls : 'x-check-group-alt',
            // Distribute controls across 3 even columns, filling each row
            // from left to right before starting the next row
            columns : 3,
            items : [{
                boxLabel : 'Item 1',
                name : 'cb-horiz-1'
            }, {
                boxLabel : 'Item 2',
                name : 'cb-horiz-2',
                checked : true
            }, {
                boxLabel : 'Item 3',
                name : 'cb-horiz-3'
            }, {
                boxLabel : 'Item 4',
                name : 'cb-horiz-4'
            }, {
                boxLabel : 'Item 5',
                name : 'cb-horiz-5'
            }]
        }, {
            xtype : 'checkboxgroup',
            fieldLabel : 'Multi-Column (vertical)',
            // Distribute controls across 3 even columns, filling each column
            // from top to bottom before starting the next column
            columns : 3,
            vertical : true,
            items : [{
                boxLabel : 'Item 1',
                name : 'cb-vert-1'
            }, {
                boxLabel : 'Item 2',
                name : 'cb-vert-2',
                checked : true
            }, {
                boxLabel : 'Item 3',
                name : 'cb-vert-3'
            }, {
                boxLabel : 'Item 4',
                name : 'cb-vert-4'
            }, {
                boxLabel : 'Item 5',
                name : 'cb-vert-5'
            }]
        }, {
            xtype : 'checkboxgroup',
            fieldLabel : 'Multi-Column<br />(custom widths)',
            cls : 'x-check-group-alt',
            // Specify exact column widths (could also include float values for %)
            columns : [100, 100],
            vertical : true,
            items : [{
                boxLabel : 'Item 1',
                name : 'cb-custwidth',
                inputValue : 1
            }, {
                boxLabel : 'Item 2',
                name : 'cb-custwidth',
                inputValue : 2,
                checked : true
            }, {
                boxLabel : 'Item 3',
                name : 'cb-custwidth',
                inputValue : 3
            }, {
                boxLabel : 'Item 4',
                name : 'cb-custwidth',
                inputValue : 4
            }, {
                boxLabel : 'Item 5',
                name : 'cb-custwidth',
                inputValue : 5
            }]
        }, {
            xtype : 'checkboxgroup',
            fieldLabel : 'Custom Layout<br />(w/ validation)',
            allowBlank : false,
            msgTarget : 'side',
            autoFitErrors : false,
            anchor : '-18',
            // You can change the 'layout' to anything you want, and include any nested
            // container structure, for complete layout control. In this example we only
            // want one item in the middle column, which would not be possible using the
            // default 'checkboxgroup' layout's columns config.  We also want to put
            // headings at the top of each column.
            layout : 'column',
            defaultType : 'container',
            items : [{
                columnWidth : .25,
                items : [{
                    xtype : 'component',
                    html : 'Heading 1',
                    cls : 'x-form-check-group-label'
                }, {
                    xtype : 'checkboxfield',
                    boxLabel : 'Item 1',
                    name : 'cb-cust-1'
                }, {
                    xtype : 'checkboxfield',
                    boxLabel : 'Item 2',
                    name : 'cb-cust-2'
                }]
            }, {
                columnWidth : .5,
                items : [{
                    xtype : 'component',
                    html : 'Heading 2',
                    cls : 'x-form-check-group-label'
                }, {
                    xtype : 'checkboxfield',
                    boxLabel : 'A long item just for fun',
                    name : 'cb-cust-3'
                }]
            }, {
                columnWidth : .25,
                items : [{
                    xtype : 'component',
                    html : 'Heading 3',
                    cls : 'x-form-check-group-label'
                }, {
                    xtype : 'checkboxfield',
                    boxLabel : 'Item 4',
                    name : 'cb-cust-4'
                }, {
                    xtype : 'checkboxfield',
                    boxLabel : 'Item 5',
                    name : 'cb-cust-5'
                }]
            }]
        }]
    };
    var fp = Ext.create('Ext.FormPanel', {
        title : 'Check/Radio Groups Example',
        frame : true,
        fieldDefaults : {
            labelWidth : 110
        },
        width : 600,
        renderTo : Ext.getBody(),
        bodyPadding : 10,
        items : [checkGroup],
        buttons : [{
            text : 'Save',
            handler : function() {
                if(fp.getForm().isValid()) {
                    Ext.Msg.alert('Submitted Values', 'The following will be sent to the server: <br />' + fp.getForm().getValues(true).replace(/&/g, ', '));
                }
            }
        }, {
            text : 'Reset',
            handler : function() {
                fp.getForm().reset();
            }
        }]
    });
    FRAME5.Ext = {
        pro : Ext,
        grid : grid
    }

    // trigger the data store load
    store2.loadPage(1);
});
