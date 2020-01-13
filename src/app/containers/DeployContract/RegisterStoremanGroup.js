import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Button, Input, message, Divider, Icon, Tooltip, Select, Row, Col } from 'antd';

import style from './index.less';
import { WANPATH } from 'utils/settings';

import { getInfoByAddress } from 'utils/helper';

const btnStyle = { marginLeft: '10px' }
@inject(stores => ({
  chainId: stores.session.chainId,
  language: stores.languageIntl.language,
  wanAddrInfo: stores.wanAddress.addrInfo,
  sgAddrPath: stores.deployContract.sgAddrPath,
  setSgAddrPath: val => stores.deployContract.setSgAddrPath(val),
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
}))

@observer
class RegisterStoremanGroup extends Component {
  state = {
    sgAddr: '',
    sgAddrNonce: '',
    smgStatus: false,
    buildRegisterSmgStatus: false,
    registerSmgStatus: false,
    registerSmgLoading: false,
    buildRegisterSmgLoading: false,
  }

  constructor (props) {
    super(props);
    this.props.changeTitle('menuConfig.deployContract');
  }

  handleGetInfo = type => {
    wand.request('offline_openFile', { type }, (err, data) => {
      if (err) {
        message.warn('Import File Error, Please insert it again')
        return;
      }
      if (data) {
        message.success('Success')
        this.setState({ [`${type}Status`]: true })
      }
    })
  }

  handleSelectAddr = (value, type) => {
    const { wanAddrInfo } = this.props;
    if (value === undefined) {
      value = ''
    }
    this.setState({ [type]: value })
    switch (type) {
      case 'sgAddr':
        let sgAddrInfo = getInfoByAddress(value, ['path'], wanAddrInfo);
        this.props.setSgAddrPath({ walletId: sgAddrInfo.type === 'normal' ? 1 : 5, path: `${WANPATH}${sgAddrInfo.path}` });
        break;
    }
  }

  handleBuildContract = type => {
    const { wanAddrInfo, setSgAddrPath } = this.props;
    const { sgAddr, sgAddrNonce } = this.state;
    this.setState({ [`${type}Loading`]: true });

    if (![sgAddr, sgAddrNonce].includes('')) {
      let obj = {
        [sgAddr]: sgAddrNonce
      };
      let sgAddrPath = getInfoByAddress(sgAddr, ['path'], wanAddrInfo);
      wand.request('offline_updateNonce', obj, (err, data) => {
        if (err) {
          this.setState({ [`${type}Loading`]: false });
          return;
        };
        let path = { walletId: sgAddrPath.type === 'normal' ? 1 : 5, path: `${WANPATH}${sgAddrPath.path}` };
        setSgAddrPath(path);
        wand.request('offline_buildContract', { type, data: path }, (err, ret) => {
          if (err || !ret.ret) {
            this.setState({ [`${type}Loading`]: false });
            message.warn('Build Failures!')
            return;
          }
          this.setState({ [`${type}Loading`]: false, [`${type}Status`]: true });
          message.success('Build Success!')
        })
      })
    } else {
      message.warn('Please insert correct data');
      this.setState({ [`${type}Loading`]: false });
    }
  }

  handleDownloadFile = type => {
    wand.request('offline_downloadFile', { type }, (err, data) => {
      if (err) {
        message.warn('Download failed. Please try again!')
        return;
      }
      message.success('Download Success!')
    })
  }

  deployContractAction = type => {
    this.setState({ [`${type}Loading`]: true });
    wand.request('offline_deployContractAction', { type }, (err, data) => {
      if (err) {
        message.warn(err.desc);
        this.setState({ [`${type}Loading`]: false });
        return;
      }
      message.success('Success!');
      if (!['setDependency'].includes(type)) {
        this.setState({ [`${type}File`]: true, [`${type}Loading`]: false });
      } else {
        this.setState({ [`${type}Loading`]: false });
      }
    })
  }

  render () {
    const { registerSmgLoading, registerSmgStatus, buildRegisterSmgLoading, buildRegisterSmgStatus, smgStatus } = this.state;
    const { wanAddrInfo } = this.props;
    let addr = Object.keys(wanAddrInfo.normal).concat(Object.keys(wanAddrInfo.import));

    return (
      <React.Fragment>
        <div className={style.offlineStep}>
          <h5 className={style.fontText + ' ' + style.inlineBlock}>Select Address</h5>
          <div>
            <Select
              autoFocus
              className="colorInput"
              optionLabelProp="value"
              optionFilterProp="children"
              onChange={value => this.handleSelectAddr(value, 'sgAddr')}
              placeholder="Select contract owner"
              dropdownMatchSelectWidth={false}
            >
              {
                addr.map((item, index) =>
                  <Select.Option value={item} key={index}>
                    <Row className="ant-row-flex">
                      <Col>{item}</Col>&nbsp;
                    </Row>
                  </Select.Option>)
              }
            </Select>
            <Input onChange={e => this.handleSelectAddr(e.target.value, 'sgAddrNonce')} className={style.nonceInput} placeholder="Input Nonce" size="small"/>
          </div>
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>1_Offline</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Build Register Storeman Group</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('smg')}>Import smg.json File</Button>
          { smgStatus && <Button type="primary" style={btnStyle} loading={buildRegisterSmgLoading} onClick={() => this.handleBuildContract('buildRegisterSmg')}>Build</Button> }
          { buildRegisterSmgStatus && <Button type="primary" style={btnStyle} onClick={() => this.handleDownloadFile(['txData', 'registerSmg.dat'])}>Download</Button> }
        </div>
        <Divider className={style.borderSty} />
        <div className={style.offlineStep}>
          <Button type="primary" className={style.stepOne}>2_Online</Button>
          <h3 className={style.stepOne + ' ' + style.inlineBlock}>Register Storeman Group</h3>
          <Button type="primary" style={btnStyle} onClick={() => this.handleGetInfo('registerSmg')}>Import registerSmg.dat File</Button>
          { registerSmgStatus && <Button type="primary" style={btnStyle} loading={registerSmgLoading} onClick={() => this.deployContractAction('registerSmg')}>Deploy</Button> }
        </div>
      </React.Fragment>
    );
  }
}

export default RegisterStoremanGroup;