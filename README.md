ThePrintlab API
==================

Server side APIs for ThePrintlab App

## Server Dependencies
- nodejs
- npm

## Sensitive Data Encryption
- config-leaf environment var:
	* `sudo echo 'NODE_LEAF_ENCRYPT_KEY=*****' > /etc/environment`
	* `source /etc/environment`
- encrypt: `npm run encrypt`

## Deployment
- development: `cap dev deploy`
- production: `cap prod deploy`

## Documentation

### Models
* [Client](client.html)
* [Address](address.html)
* [Order](order.html)

