Web UI for Aircrack-ng
=============

Very buggy but will crack wep keys.

Install
-------

So you will ne a few things installed. Listed here:

* [Aircrack-ng](http://www.aircrack-ng.org/) -- Ubuntu/Debian: `sudo apt-get install aircrack-ng` Fedora/RPM: `sudo yum install aircrack-ng`
* [Node.js](http://nodejs.org/) -- Node.js for the server


Installing node.js
------------

Ok I'm going to show you how to install Node.js


### Ubuntu/Debian

Install the Dependencies
    sudo apt-get -y install build-essential g++ libssl-dev
    sudo apt-get -y install g++ curl libssl-dev apache2-utils
    sudo apt-get -y install git-core

### Fedora

Install the Dependencies

    sudo yum install g++ curl libssl-dev apache2-utils
    sudo yum install git-core

Compile Node.js

    mkdir /tmp/nodejs
    cd /tmp/nodejs
    wget http://nodejs.org/dist/v0.6.6/node-v0.6.6.tar.gz
    tar -zxvf node-v0.6.2.tar.gz
    cd node-v0.6.2
    ./configure
    make
    
and then

    sudo make install















Once your script is in place, edit `lib/github/markups.rb` and tell
GitHub Markup about it. Again we look to [rest2html][r2hc] for
guidance:

    command(:rest2html, /re?st(.txt)?/)

Here we're telling GitHub Markup of the existence of a `rest2html`
command which should be used for any file ending in `rest`,
`rst`, `rest.txt` or `rst.txt`. Any regular expression will do.

Finally add your tests. Create a `README.extension` in `test/markups`
along with a `README.extension.html`. As you may imagine, the
`README.extension` should be your known input and the
`README.extension.html` should be the desired output.

Now run the tests: `rake`

If nothing complains, congratulations!


### Classes

If your markup can be translated using a Ruby library, that's
great. Check out Check `lib/github/markups.rb` for some
examples. Let's look at Markdown:

    markup(:markdown, /md|mkdn?|markdown/) do |content|
      Markdown.new(content).to_html
    end

We give the `markup` method three bits of information: the name of the
file to `require`, a regular expression for extensions to match, and a
block to run with unformatted markup which should return HTML.

If you need to monkeypatch a RubyGem or something, check out the
included RDoc example.

Tests should be added in the same manner as described under the
`Commands` section.


Installation
-----------

    gem install github-markup


Usage
-----

    require 'github/markup'
    GitHub::Markup.render('README.markdown', "* One\n* Two")

Or, more realistically:

    require 'github/markup'
    GitHub::Markup.render(file, File.read(file))


Testing
-------

To run the tests:

    $ rake

To add tests see the `Commands` section earlier in this
README.


Contributing
------------

1. Fork it.
2. Create a branch (`git checkout -b my_markup`)
3. Commit your changes (`git commit -am "Added Snarkdown"`)
4. Push to the branch (`git push origin my_markup`)
5. Create an [Issue][1] with a link to your branch
6. Enjoy a refreshing Diet Coke and wait


[r2h]: http://github.com/github/markup/tree/master/lib/github/commands/rest2html
[r2hc]: http://github.com/github/markup/tree/master/lib/github/markups.rb#L13
[1]: http://github.com/github/markup/issues